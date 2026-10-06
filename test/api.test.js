const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const test = require('node:test');

const sqlitePath = path.join(os.tmpdir(), `saas-api-${randomUUID()}.db`);
process.env.SAAS_SQLITE_PATH = sqlitePath;
const app = require('../backend/server');
const db = require('../backend/database');

let server;
let baseUrl;

test('authenticated API isolates user data and gates social features', async (t) => {
  await db.ready;
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const call = async (route, { method = 'GET', cookie, body } = {}) => {
    const response = await fetch(`${baseUrl}/api${route}`, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { 'content-type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return {
      response,
      data: await response.json(),
      cookie: response.headers.get('set-cookie')?.split(';', 1)[0]
    };
  };

  const createUser = async (username) => {
    const { response, data, cookie } = await call('/register', {
      method: 'POST',
      body: {
        username,
        email: `${username}@example.test`,
        password: 'SecurePass123!',
        schoolType: 'Gymnasium',
        schoolClass: '10',
        birthdate: '2009-01-01'
      }
    });
    assert.equal(response.status, 201);
    assert.ok(cookie);
    return { user: data.user, cookie };
  };

  try {
    const alice = await createUser(`alice_${randomUUID().slice(0, 8)}`);
    const bob = await createUser(`bob_${randomUUID().slice(0, 8)}`);

    const anonymous = await call('/friends');
    assert.equal(anonymous.response.status, 401);

    const createTask = await call('/tasks', {
      method: 'POST',
      cookie: alice.cookie,
      body: { userId: bob.user.id, title: 'Private task', description: '', dueDate: '2026-10-01' }
    });
    assert.equal(createTask.response.status, 201);

    const aliceTasks = await call('/tasks', { cookie: alice.cookie });
    assert.equal(aliceTasks.data.tasks.length, 1);
    assert.equal(aliceTasks.data.tasks[0].user_id, alice.user.id);
    assert.equal(aliceTasks.data.tasks[0].dueDate, '2026-10-01');
    const bobTasks = await call('/tasks', { cookie: bob.cookie });
    assert.equal(bobTasks.data.tasks.length, 0);
    const unauthorizedEdit = await call(`/tasks/${createTask.data.task.id}`, {
      method: 'PUT',
      cookie: bob.cookie,
      body: { completed: true }
    });
    assert.equal(unauthorizedEdit.response.status, 404);
    const analytics = await call('/analytics', { cookie: alice.cookie });
    assert.equal(analytics.response.status, 200);
    assert.equal(analytics.data.tasks[0].completedAt, null);

    const defaultPrivacy = await call('/privacy', { cookie: alice.cookie });
    assert.equal(defaultPrivacy.data.settings.show_in_leaderboard, 0);
    const savedNotificationSettings = await call('/notification-settings', {
      method: 'PUT',
      cookie: alice.cookie,
      body: { dailySummary: true, repeat: 'weekly', time: '18:30', weekday: 4 }
    });
    assert.equal(savedNotificationSettings.response.status, 200);
    const loadedNotificationSettings = await call('/notification-settings', { cookie: alice.cookie });
    assert.equal(loadedNotificationSettings.data.settings.dailySummary, true);
    assert.equal(loadedNotificationSettings.data.settings.time, '18:30');

    const forbiddenXp = await call('/xp', {
      method: 'POST',
      cookie: alice.cookie,
      body: { reason: 'unknown', eventKey: randomUUID() }
    });
    assert.equal(forbiddenXp.response.status, 400);

    const noFriendMessages = await call(`/messages/${bob.user.id}`, {
      method: 'POST',
      cookie: alice.cookie,
      body: { body: 'Hello' }
    });
    assert.equal(noFriendMessages.response.status, 403);

    const request = await call(`/friends/${bob.user.id}`, { method: 'POST', cookie: alice.cookie });
    assert.equal(request.response.status, 201);
    const bobFriends = await call('/friends', { cookie: bob.cookie });
    const friendRequest = bobFriends.data.friends.find((friend) => friend.status === 'pending');
    assert.ok(friendRequest);

    const accepted = await call(`/friends/${friendRequest.id}`, {
      method: 'PUT',
      cookie: bob.cookie,
      body: { status: 'accepted' }
    });
    assert.equal(accepted.response.status, 200);

    const privateResource = await call('/resources', {
      method: 'POST',
      cookie: alice.cookie,
      body: { title: 'Private link', url: 'https://example.test/private', kind: 'link' }
    });
    assert.equal(privateResource.response.status, 201);
    const privateResourcesForBob = await call('/resources', { cookie: bob.cookie });
    assert.equal(privateResourcesForBob.data.resources.length, 0);

    const sharedResource = await call('/resources', {
      method: 'POST',
      cookie: alice.cookie,
      body: { title: 'Friend link', url: 'https://example.test/friends', kind: 'article', visibility: 'friends' }
    });
    assert.equal(sharedResource.response.status, 201);
    const friendResourcesForBob = await call('/resources', { cookie: bob.cookie });
    assert.equal(friendResourcesForBob.data.resources.length, 1);
    const hiddenResourceSave = await call(`/resources/${privateResource.data.resource.id}/saved`, {
      method: 'PUT',
      cookie: bob.cookie,
      body: { saved: true }
    });
    assert.equal(hiddenResourceSave.response.status, 404);

    const xpEventKey = randomUUID();
    const xpAward = await call('/xp', {
      method: 'POST',
      cookie: alice.cookie,
      body: { reason: 'task_completed', eventKey: xpEventKey }
    });
    assert.equal(xpAward.response.status, 201);
    const duplicatedXp = await call('/xp', {
      method: 'POST',
      cookie: alice.cookie,
      body: { reason: 'task_completed', eventKey: xpEventKey }
    });
    assert.equal(duplicatedXp.response.status, 409);

    const sentMessage = await call(`/messages/${bob.user.id}`, {
      method: 'POST',
      cookie: alice.cookie,
      body: { body: 'Lass uns zusammen lernen.' }
    });
    assert.equal(sentMessage.response.status, 201);
    const receivedMessages = await call(`/messages/${alice.user.id}`, { cookie: bob.cookie });
    assert.equal(receivedMessages.data.messages[0].body, 'Lass uns zusammen lernen.');

    const createdGroup = await call('/groups', {
      method: 'POST',
      cookie: alice.cookie,
      body: { name: 'Mathegruppe', description: 'Gemeinsam üben', subject: 'Mathe' }
    });
    assert.equal(createdGroup.response.status, 201);
    const aliceGroups = await call('/groups', { cookie: alice.cookie });
    assert.equal(aliceGroups.data.groups[0].joinCode, createdGroup.data.group.joinCode);
    const joined = await call('/groups/join', {
      method: 'POST',
      cookie: bob.cookie,
      body: { joinCode: createdGroup.data.group.joinCode }
    });
    assert.equal(joined.response.status, 200);

    const privateGroup = await call(`/groups/${createdGroup.data.group.id}/items`, { cookie: bob.cookie });
    assert.equal(privateGroup.response.status, 200);
    const groupGoal = await call(`/groups/${createdGroup.data.group.id}/goals`, {
      method: 'POST',
      cookie: alice.cookie,
      body: { title: 'Kapitel üben', target: 4 }
    });
    assert.equal(groupGoal.response.status, 201);
    const goalProgress = await call(`/groups/${createdGroup.data.group.id}/goals/${groupGoal.data.goal.id}`, {
      method: 'PUT',
      cookie: bob.cookie,
      body: { progress: 2 }
    });
    assert.equal(goalProgress.response.status, 200);
    const outsiderGroup = await createUser(`eve_${randomUUID().slice(0, 8)}`);
    const rejectedGroup = await call(`/groups/${createdGroup.data.group.id}/items`, { cookie: outsiderGroup.cookie });
    assert.equal(rejectedGroup.response.status, 403);

    const logout = await call('/logout', { method: 'POST', cookie: alice.cookie });
    assert.equal(logout.response.status, 200);
    const afterLogout = await call('/friends', { cookie: alice.cookie });
    assert.equal(afterLogout.response.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await db.close();
    try {
      fs.unlinkSync(sqlitePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
});
