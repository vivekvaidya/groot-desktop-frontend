/**
* Copyright © 2017, ACM@UIUC
*
* This file is part of the Groot Project.  
* 
* The Groot Project is open source software, released under the University of
* Illinois/NCSA Open Source License. You should have received a copy of
* this license in a file with the distribution.
**/

const SERVICES_URL = process.env.SERVICES_URL || 'http://localhost:8000';
const GROOT_ACCESS_TOKEN = process.env.GROOT_ACCESS_TOKEN || "TEMP_STRING";
const request = require('request');
const utils = require('../../etc/utils.js');

module.exports = function(app) {
  app.get('/intranet/users', function(req, res){
    if(!req.session.roles.isAdmin && !req.session.roles.isTop4) {
      res.redirect('/login');
    }

    request({
      url: `${SERVICES_URL}/users/pre`,
      method: "POST",
      headers: {
        "Authorization": GROOT_ACCESS_TOKEN
      },
      body: {
        "token": req.session.student.token,
      },
      json: true
    }, function(err, response, body) {
      if(err) {
        return res.status(500).send("Sorry, there was a server error.  Please try again.");
      }
      res.render('users_index', {
        authenticated: utils.isAuthenticated(req),
        session:req.session,
        premembers: body,
        messages: req.flash('success')
      });
    });

  });


  app.get('/intranet/users/:approvedUserNetID', function(req, res){
    if(!req.session.roles.isAdmin && !req.session.roles.isTop4) {
      return res.redirect('/login');
    }

    request({
      url: `${SERVICES_URL}/users/paid`,
      method: "POST",
      headers: {
        "Authorization": GROOT_ACCESS_TOKEN
      },
      body: {
        "token" : req.session.student.token,
        "netid" : req.params["approvedUserNetID"],
      },
      json: true
    }, function(err) {
      if(err) {
        req.flash('error', "There was an issue, and the member may not have been added. Please contact someone from the Admin committee.");
      } else {
        req.flash('success', "The member was added successfully!");
      }

      res.redirect('/intranet/users');
    });
  });

  app.post('/join', function(req, res) {
    var userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      netid: req.body.netid,
      uin: req.body.uin
    };
    request({
      url: `${SERVICES_URL}/users/newUser`,
      method: "POST",
      headers: {
        "Authorization": GROOT_ACCESS_TOKEN
      },
      body: userData,
      json: true
    }, function(err, response, body) {
      if(err || !response || response.statusCode != 200) {
        req.flash('error', err || body.error);
      } else {
        req.flash('success', "Added as a premember");
      }
      res.redirect('/join');
    });
  });

  app.post('/login', function(req, res){
    request({
      url: `${SERVICES_URL}/users/login`,
      method: "POST",
      json: true,
      headers: {
        "Authorization": GROOT_ACCESS_TOKEN
      },
      body: req.body
    }, function(err, response, body) {
      if(err || !response || response.statusCode != 200) {
        req.flash('error', (body && body.error) || err);
        res.redirect('/login');
      } else {
        req.session.student = {
          first_name: body.data.first_name,
          last_name: body.data.last_name,
          token: body.data.token,
          netid: body.data.netid
        };
        req.session.username = req.session.student.first_name;
        req.session.roles.isStudent = true;

        utils.setAuthentication(req, res, function(req, res) {
          res.redirect('/intranet');
        });
      }
    });
  });
};
