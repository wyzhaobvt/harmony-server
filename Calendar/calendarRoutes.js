const express = require('express');
const bodyParser = require('body-parser');
const {
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
} = require('./index.js');

const router = express.Router();

router.use(bodyParser.json());

router.get('/listcalendars', async (req, res) => {
    try {
        const calendars = await listCalendars();
        res.json(calendars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/getcalendarid/:calendarName', async (req, res) => {
    try {
        const id = await getCalendarIdByName(req.params.calendarName);
        res.json(id);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/geteventid/:calendarName/:eventName', async (req, res) => {
    try {
        const id = await getEventIdByName(req.params.calendarName, req.params.eventName);
        res.json(id);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define other routes as needed...

module.exports = router;
