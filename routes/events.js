var express = require('express');
var router = express.Router();

var _ = require('underscore');
var Q = require('q');

var User = require('../db/user');
var Event = require('../db/event');
var Location = require('../db/location');

var getErrorObj = require('../errors').getErrorObj;

var getPublicEvent = require('../public').getPublicEvent;

function populateEvent(event) { 
	return Q.Promise(function(resolve, reject){
		Event.populate(event, 'owner location attendees', function(err, populated) {
			if(err)
			{
				reject(err);
				return;
			}

			var options = [
				{ path: 'owner.locations', model: 'Location' },
				{ path: 'attendees.locations', model: 'Location' }
			];

			User.populate(event, options, function(err, populated) {
				if(err)
				{
					reject(err);
					return;
				}

				resolve(populated);

			})

			
		});
		
	});
}

function validateAndSaveEvent(event) {
	valid = Q.Promise(function(resolve, reject){
		event.validate(function(err) {
			if(err)
				reject(err);
			else
				resolve();
		})
	});

	return valid.then(function() {
		return Location.exists(event.location)
	})
	.then(function() {
		return User.exists(event.owner)
	})
	.then(function(){
		return Q.all(_.map(event.attendees, function(attendee) {
			return User.exists(attendee);
		}));
	})
	.then(function(){
		return Q.Promise(function(resolve, reject) {
			event.save(function( err, resultEvent ) {
				if(err)
				{
					reject(err);
				}
				else
				{
					resolve(resultEvent);
				}
			});
		});
	})
	.then(function(event) {
		return populateEvent(event);
	});
}

router.get('/', function(req, res) {
	var limit = req.query['limit'] || 20;
	var offset = req.query['offset'] || 0;
	var status = req.query['status'];

	var query = {  };

	if(!_.contains(req.user.roles, "staff"))
	{
		query = {
			$or: [
				{ status: 'approved' },
				{ owner:  req.user._id }
			]
		}
	}
	else
	{
		if(status)
			query.status = status;
		else
			query.status = { $ne: 'canceled' };
	}

	Event.find(query, null, { skip: offset, limit: limit }, function (err, events) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			return;
		}

		populations = _.map(events, function(event) {
			return populateEvent(event);
		});

		Q.all(populations).then(function(events) {

			events = _.map(events, function(event) {
				return getPublicEvent(event);
			});

			res.send({
				events: events
			});

		}).catch(function(err) {
			res.status(400).send(getErrorObj(err));
		});

	});
});

router.post('/', function(req, res) {

	if(!req.body.event)
	{
		res.status(400).send({ message: "No event sent "});
		return;
	}

	var eventdata = req.body.event;
	var event = new Event();

	event.owner = eventdata.owner.id;
	event.description = eventdata.description;
	event.location = eventdata.location.id;
	event.trees = eventdata.trees;
	event.datetime = eventdata.datetime;
	event.endtime = eventdata.endtime;
	event.status = eventdata.status;
	event.attendees = _.pluck(eventdata.attendees, 'id');
	event.staffNotes = eventdata.staffNotes;

	
	validateAndSaveEvent(event).then(function (event) {
		res.status(201).send({
			events: [getPublicEvent(event)]
		});
	})
	.catch(function(err){
		console.log(err);
		res.status(400).send(getErrorObj(err));
	});
});

router.get('/:id', function(req, res) {

	var id = req.params['id'];

	Event.findById(id, function (err, event) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!event) {
			res.status(404).send({
				message: "No event with that id found"
			});
			return;
		}

		populateEvent(event).then(function(eventObj) {
			res.send({
				events: [getPublicEvent(eventObj)]
			});
		}).catch(function(err) {
			res.status(400).send(getErrorObj(err));
		});

	});
});

router.put('/:id', function(req, res) {
	var id = req.params['id'];

	var updateable = [
		'description',
		'endtime',
		'staffNotes',
		'trees'
	];

	Event.findById(id, function (err, event) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!event) {
			res.status(404).send({
				message: "No event with that id found"
			});
			return;
		}

		var fields = _.pick(req.body.event, updateable);

		_.extend(event, fields);

		if(req.body.event.attendees)
		{
			event.attendees = _.pluck(req.body.event.attendees, 'id');
		}

		validateAndSaveEvent(event).then(function (event) {
			res.status(201).send({
				events: [getPublicEvent(event)]
			});
		})
		.catch(function(err){
			console.log(err);
			res.status(400).send(getErrorObj(err));
		});

	});
});

router.delete('/:id', function(req, res) {
	var id = req.params['id'];

	Event.findById(id, function (err, event) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!event) {
			res.status(404).send({
				message: "No event with that id found"
			});
			return;
		}

		event.remove(function(err) {
			if(err)
			{
				res.status(500).send(getErrorObj(err));
			}
			else
			{
				res.send({
					message:'Event Deleted'
				});
			}
		});
	});
});

router.post('/:id/:verb', function(req, res){
	var id = req.params['id'];

	Event.findById(id, function (err, event) {
		if(err)
		{
			console.log(err);
			res.status(400).send(getErrorObj(err));
			return;
		}

		if(!event) {
			res.status(404).send({
				message: "No event with that id found"
			});
			return;
		}

		var verb = req.params['verb'];
		if(!/^attend|notattend|cancel|accept|reject$/.test(verb))
		{
			res.status(404).send({
				message: "Invalid verb"
			});
			return;
		}

		if(verb == 'attend') {
			event.attendees.addToSet(req.user._id);
		} else if(verb == 'notattend') {
			event.attendees = _.without(event.attendees, req.user._id);
		} else if(verb == 'cancel') {
			event.status = 'canceled'
		} else if(verb == 'accept') {
			event.status = 'approved'
		} else if(verb == 'reject') {
			event.status = 'rejected'
		}

		event.save(function(err) {
			if(err)
				res.status(500).send(getErrorObj(err));
			else
				res.send({
					message: "success"
				});
		});
	});
});

module.exports = router;