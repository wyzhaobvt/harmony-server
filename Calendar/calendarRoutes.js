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
        console.log('/listcalendars accessed');
        res.json(calendars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/getcalendarid/:calendarName', async (req, res) => {
    try {
        const id = await getCalendarIdByName(req.params.calendarName);
        console.log('/getcalendarid accessed');
        res.json(id);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/geteventid/:calendarName/:eventName', async (req, res) => {
    try {
        const id = await getEventIdByName(req.params.calendarName, req.params.eventName);
        console.log('/geteventid accessed');
        res.json(id);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/listevents/:calendarName', async (req, res) => {
    try {
        const events = await listEvents(req.params.calendarName);
        console.log('/listevents accessed');
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/createevent', async (req, res) => {
    try {
        await createEvent(req.body.calendar, req.body.event );
        console.log('/createevent accessed:', req.body.calendar, req.body.event);
        res.json({message: `event created successfully in '${req.body.calendar}'`, event: req.body.event});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.put('/editevent', async (req, res) => {
    try {
        await editEvent(req.body.calendar, req.body.eventName, req.body.newEvent );
        console.log('/editevent accessed');
        res.json({message: `event edited successfully in '${req.body.calendar}'`, newEvent: req.body.newEvent});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.delete('/deleteevent', async (req, res) => {
    try {
        await deleteEvent(req.body.calendar, req.body.eventName);
        console.log('/deleteevent accessed');
        res.json({message: `event deleted successfully from '${req.body.calendar}'`});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

module.exports = router;
