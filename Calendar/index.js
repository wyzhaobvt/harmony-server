const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const TOKEN_PATH = path.join(process.cwd(), './Calendar/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './Calendar/credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const sampleEvent = {
    'summary': 'CREATED BY HARMONY APP',
    'location': '800 Howard St., San Francisco, CA 94103',
    'description': 'Sample event created by Harmony APP',
    'start': {
      'dateTime': '2024-03-28T09:00:00-07:00',
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'dateTime': '2024-03-28T17:00:00-07:00',
      'timeZone': 'America/Los_Angeles',
    },
    'recurrence': [
      'RRULE:FREQ=DAILY;COUNT=1'
    ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
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

// Lists all available calendars.
async function listCalendars() {
    const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.calendarList.list();
    const calendars = res.data.items.filter((calendar) => calendar.accessRole === 'owner');
    if (!calendars || calendars.length === 0) {
      // console.log('No calendars found.');
      throw new Error('No calendars found.');
      return null
    }
    // console.log('Group Calendars:');
    // calendars.forEach((calendar) => {
    //   console.log(`${calendar.summary} - ${calendar.id}`);
    // });
    const simplifiedCalendars = calendars.map((calendar) => ({
      name: calendar.summary,
      id: calendar.id
    }));
    return simplifiedCalendars;
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
    // console.log(targetCalendar.id);
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

// Lists upcoming events on the selected calendar.
async function listEvents(calendarName) {
    const calendarIdObject = await getCalendarIdByName(calendarName)
    const calendarId = calendarIdObject.id
    const auth = await authorize(); // Assuming `authorize()` returns the authenticated client
    const calendar = google.calendar({version: 'v3', auth});
    const res = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
    });
    const events = res.data.items;
        if (!events || events.length === 0) {
        console.log('No upcoming events found.');
        return;
    }
    console.log('Upcoming events:');
    events.forEach((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary} - ${event.id}`);
    });
}
// Creates event on the selected calendar.
async function createEvent(calendarName, event) {
    const auth = await authorize();
    const calendarId = await getCalendarIdByName(calendarName)
    const calendar = google.calendar({version: 'v3', auth});
        calendar.events.insert({
            auth: auth,
            calendarId: calendarId,
            resource: event,
            }, function(err, event) {
            if (err) {
                console.log('There was an error contacting the Calendar service: ' + err);
                return;
            }
            console.log('Event created: %s', event.data.htmlLink);
            });
}
// Edits event on the selected calendar
async function editEvent(calendarName, eventName, updatedEvent) {
  const eventId = await getEventIdByName(calendarName, eventName)
  const auth = await authorize();
  const calendarId = await getCalendarIdByName(calendarName);
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.events.update({
      auth: auth,
      calendarId: calendarId,
      eventId: eventId,
      resource: updatedEvent,
  }, function(err, event) {
      if (err) {
          console.log('There was an error updating the event: ' + err);
          return;
      }
      console.log('Event updated: %s', event.data.htmlLink);
  });
}
// Deletes event from the selected calendar.
async function deleteEvent(calendarName, eventName) {
    const eventId = await getEventIdByName(calendarName, eventName)
    const calendarId = await getCalendarIdByName(calendarName)
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    console.log('Event deleted successfully');
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
// listEvents('group1')
// deleteEvent('group1', 'CREATED BY HARMONY APP')
// listCalendars()
// editEvent('group1', 'Sample Event', sampleEvent)

// getEventIdByName('group1', 'sample')
// getCalendarIdByName('group1')