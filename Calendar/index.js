const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const TOKEN_PATH = path.join(process.cwd(), './Calendar/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './Calendar/credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const sampleEvent = {
    'summary': 'Edited Once Again',
    'description': 'Sample edited event description - created by Harmony APP',
    'start': {
      'dateTime': '2024-03-14T08:00:00-07:00',
    },
    'end': {
      'dateTime': '2024-03-14T09:00:00-07:00',
    },
};

// Reads previously authorized credentials from the save file.
async function loadSavedCredentialsIfExist() {
    try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
    } catch (err) {
    return null;
    }
}
// Writes credentials to a file compatible with GoogleAUth.fromJSON.
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}
// Load or request or authorization to call APIs.
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Get calendar's ID for use in other functions by inputting its name.
async function getCalendarIdByName(calendarName) {
  const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;
  const targetCalendar = calendars.find(calendar => calendar.summary === calendarName);
  if (!targetCalendar) {
      throw new Error(`No calendar with name '${calendarName}' was found.`);
  }
  return {name: calendarName, id: targetCalendar.id};
}
// Get event's ID for use in other functions by inputting its name.
async function getEventIdByName(calendarName, eventName) {
  const calendarIdObject = await getCalendarIdByName(calendarName);
  const calendarId = calendarIdObject.id
  const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  const targetEvent = events.find((event) => event.summary === eventName);
  if (!targetEvent) {
    throw new Error('Event not found');
  }
  return {name: eventName, id: targetEvent.id}
}

// Lists all available calendars.
async function listCalendars() {
    const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.calendarList.list();
    const calendars = res.data.items.filter((calendar) => calendar.accessRole === 'owner');
    if (!calendars || calendars.length === 0) {
      throw new Error('No calendars found.');
    }
   
    const simplifiedCalendars = calendars.map((calendar) => ({
      name: calendar.summary,
      id: calendar.id
    }));
    return simplifiedCalendars;
}
// Lists upcoming events on the selected calendar.
async function listEvents(calendarName) {
  const calendarIdObject = await getCalendarIdByName(calendarName);
  const calendarId = calendarIdObject.id;
  const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
  });

  const events = res.data.items;
  const upcomingEvents = [];

  if (!events || events.length === 0) {
      return { error: 'No upcoming events found.' };
  }

  events.forEach((event, i) => {
    const start = event.start.dateTime || event.start.date;
    upcomingEvents.push({
        name: event.summary,
        date: start,
        description: event.description || ''
    });
  });
  return upcomingEvents;
}
// Creates event on the selected calendar.
async function createEvent(calendarName, event) {
    const auth = await authorize();
    const calendarIdObject = await getCalendarIdByName(calendarName)
    const calendarId = calendarIdObject.id;

    const calendar = google.calendar({version: 'v3', auth});
        calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: event,
            }, function(err, event) {
            if (err) {
                throw new Error('err')
            }
            });
        return {message: 'Event created successfully.'}
}
// Edits event on the selected calendar
async function editEvent(calendarName, eventName, updatedEvent) {
  const eventIdObject = await getEventIdByName(calendarName, eventName)
  const eventId = eventIdObject.id;
  const auth = await authorize();
  const calendarIdObject = await getCalendarIdByName(calendarName);
  const calendarId = calendarIdObject.id;
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.events.update({
      auth: auth,
      calendarId: calendarId,
      eventId: eventId,
      resource: updatedEvent,
  }, function(err, event) {
      if (err) {
          throw new Error(err);
      }
      return {message: 'Event edited successfully.'} 
  });
}
// Deletes event from the selected calendar.
async function deleteEvent(calendarName, eventName) {
    const eventIdObject = await getEventIdByName(calendarName, eventName)
    const eventId = eventIdObject.id;
    const calendarIdObject = await getCalendarIdByName(calendarName)
    const calendarId = calendarIdObject.id;
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
}

module.exports = {
  loadSavedCredentialsIfExist,
    saveCredentials,
    authorize,
    listCalendars,
    getCalendarIdByName,
    getEventIdByName,
    listEvents,
    createEvent,
    editEvent,
    deleteEvent
};

// createEvent('group1', sampleEvent)
// listEvents('group2')
// deleteEvent('group1', 'CREATED BY HARMONY APP')
// listCalendars()
// editEvent('group1', 'Edited Name Here', sampleEvent)
// getEventIdByName('group1', 'sample')
// getCalendarIdByName('group1')