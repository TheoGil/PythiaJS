/*jslint browser: true*/

(function (ctx) {

  var libname = "PythiaJS";

  var data, dataArchives, threshold, pageBottomReachedEvent, visitsSortedByDay, geoLocationWatcher;

  var debugMode = false;

  var geo = {
    init: function () {
      geoLocationWatcher = navigator.geolocation.watchPosition(function (position) {

        geo.handleNewGeoData(position);
      }, function (error) {
        geo.handleGeoError(error);
      });
    },

    clearGeolocationWatcher: function () {
      navigator.geolocation.clearWatch(geoLocationWatcher);
    },

    handleNewGeoData: function (position) {

      if (!data.geolocation) {
        data.geolocation = {
          position: {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
        };
      } else {

        var oldCoords = data.geolocation.position;
        var newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        if (geo.coordinatesAreDifferents(oldCoords, newCoords)) {

          if (!data.geolocation.hasMoved) {
            data.geolocation.hasMoved = true;
          }

          if (data.geolocation.hasOwnProperty('position_history')) {
            data.geolocation.position_history.push(data.geolocation.position);
          } else {
            data.geolocation.position_history = [data.geolocation.position];
          }

          data.geolocation.position = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
        }
      }

      // localStorage.setItem("awareJs-current", JSON.stringify( data ) );
    },

    handleGeoError: function (error) { console.warn(error); },

    coordinatesAreDifferents: function (oldCoords, newCoords) {
      if (oldCoords !== null) {
        if (oldCoords.lat !== newCoords.lat || oldCoords.lon !== newCoords.lon) {
          return true;
        }  
      } ;
      return false;
    },

    getApproximatePositionAsString: function (position) {
      return "lat" + position.lat.toFixed(2) + "lon" + position.lon.toFixed(2);
    },

    updateRanking: function (placeId, rankingObj) {
      if (rankingObj[placeId]) {
        rankingObj[placeId]++;
      } else {
        rankingObj[placeId] = 1;
      }

      return rankingObj;
    }  
  };

  var behaviour = {
    totalHiddenTime: 0,

    init: function () {
      threshold = document.documentElement.scrollHeight;

      pageBottomReachedEvent = new Event('pageBottomReached');

      window.addEventListener("scroll", behaviour.onScroll);
      window.addEventListener("pageBottomReached", behaviour.onPageBottomReached);
      document.addEventListener("visibilitychange", behaviour.onVisibilityChange, false);
      window.addEventListener('beforeunload', behaviour.unload, false);

      // onScroll est appelé au cas où l'utilisateur n'ai pas à scroller pour lire tout le contenu
      behaviour.onScroll();
    },

    onScroll: function(e){
      var scrollY = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || window.scrollY;
      if ( (scrollY + document.documentElement.clientHeight) >= threshold) {
        window.dispatchEvent(pageBottomReachedEvent);
      };
    },

    onPageBottomReached: function(){
      if (data.pageBottomReached != true) {
        data.pageBottomReached = true;
      };
    },

    onVisibilityChange: function(e){
      if ( document.visibilityState == "hidden" ) {
        hiddenTimer = new Date().getTime();
      } else if ( document.visibilityState == "visible" ) {
        var now = new Date().getTime();
        var diff = now - hiddenTimer;
        hiddenTimer = null;
        behaviour.totalHiddenTime += diff;
      };
    },

    unload: function(){
      if (!debugMode) { time.updateVisitDuration() };
    }
  };

  var time = {
    pagesViewsOverlap: function(now, then){
      if ( now > (then - 2500) && now < (then + 2500) ) { return true } else { return false };
    },

    /*
    * Lorsqu'on passe 0 en argument, il est évalué falsy et getCurrentTimeSlot renvoie le créneau temporel actuel
    */
    getTimeSlot: function(hour){
      if (!hour) {
        var now = new Date().getHours();
      } else {
        var now = hour;
      }
      var timeslot = null;

      if (now > 0 && now < 6) {
        timeslot = "night";
      } else if (now > 5 && now < 9) {
        timeslot = "earlymorning";
      } else if (now > 8 && now < 12) {
        timeslot = "morning";
      } else if (now > 11 && now < 15) {
        timeslot = "midi";
      }else if (now > 14 && now < 18) {
        timeslot = "afternoon";
      } else if (now > 17 && now < 24) {
        timeslot = "evening";
      };

      return timeslot;
    },

    updateVisitDuration : function(){

      var now = new Date().getTime();
      var then = data.date.getTime();

      var elapsedTime = now - then;
      data.visitDuration = elapsedTime - behaviour.totalHiddenTime;
      data.hiddenTime = behaviour.totalHiddenTime;

      localStorage.setItem("awareJs-current", JSON.stringify( data ) );
    },


    sortVisitsByDay: function(){
    	var dataArchives_length = dataArchives.length;

      sortedDays = {};

      for (var i = 0; i < dataArchives_length; i++) {
        var str_visit_date = time.getDDMMYYYYFromDate( new Date( dataArchives[i].date ) ).full;

        if (!sortedDays[str_visit_date]) {
          sortedDays[str_visit_date] = [dataArchives[i]];
        } else {
          sortedDays[str_visit_date].push(dataArchives[i]);
        }
      };

      return sortedDays;
    },

    /*
      Credit: @o-o
      http://stackoverflow.com/a/3067896
    */
    getDDMMYYYYFromDate: function(date){
      // DD and MM may be just D or M, no padding needed here
      var dd   = date.getDate().toString();
      var mm   = (date.getMonth()+1).toString();
      var yyyy = date.getFullYear().toString();

      return {
        full: dd+"-"+mm+"-"+yyyy,
        day: dd,
        month: mm,
        year: yyyy
      }
    },

    getUserVisitRatio: function(accuracy){
      var userHasVisitedSiteCounter = 0;

      var dateToTest = new Date();

      for (var i = accuracy - 1; i >= 0; i--) {

        dateToTest.setDate( dateToTest.getDate() - 1 );

        if ( visitsSortedByDay[ time.getDDMMYYYYFromDate( dateToTest ).full ] ) {
          userHasVisitedSiteCounter++  
          continue;
        };
      };

      return userHasVisitedSiteCounter/accuracy;
    },

    getVisitsSince: function(dateArg){
      var visits = [];

      if (dateArg) {

        if (!utils.isValidDate(dateArg)) {
          throw new Error(libname + " - getVisitsSince(): Arg must be a Date object or at least convertible to a Date object.");
          return;
        };

        var date = new Date(dateArg);

        var time = date.getTime();

        for (var i = 0; i < dataArchives.length; i++) {
          var visit = dataArchives[i];

          var visitDate = new Date(visit.date);

          var visitDateTime = visitDate.getTime();

          if (visitDateTime > time) {
            visits.push(visitDate);
          };
        };  
      } else {
        for (var i = 0; i < dataArchives.length; i++) {
          visits.push( dataArchives[i].date );
        };
      }

      return visits;
    },
  };

  var hardware = {
    OSList: {
      "Win"   : "Windows",
      "Mac"   : "OSX",
      "X11"   : "UNIX",
      "Linux" : "Linux"
    },

    /*
    *  Return boolean
    *    If any of the userAgent matches any of those strings specifics to mobile devices, function returns true, else, return false
    *  /!\ NOTE: As the user agent can be overriden, this method isn't 100% relialable and should be use with caution!
    *  /!\ DEVICES RETURNING FALSE WHEN THEY SHOULD RETURN TRUE:
    *    - Blackberry Playbook
    */
    isMobile: function(){
      var response = ( /android|webos|iphone|ipad|ipod|blackberry|windows phone|mobile/i.test(navigator.userAgent) ? true : false )
      return response;
    },

    /*
    *  @toimplement
    *  Se baser sur isMobile et les ressources suivantes: 
    *    Liste des userAgent de tablettes:
    *      https://udger.com/resources/ua-list/device-detail?device=Tablet
    *    Big fat user agent list
    *      http://whichbrowser.net/data/useragents/index.html
    */
    isTablet: function(){
      return "@todo: implémenter cette fonction";
    },

    /*
    *  @toimplement
    *  Se baser sur isMobile et les ressources suivantes: 
    *    Liste des userAgent de consoles:
    *      https://udger.com/resources/ua-list/device-detail?device=Game%20console
    */
    isConsole: function(){
      return "@todo: implémenter cette fonction";
    },

    getBrowser: function(){
      var browser = {
        'browser' : null,
        'version': null
      };

      var ua = navigator.userAgent;
      var filteredData = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if (filteredData.length>1) {
        browser.browser = filteredData[1];
        browser.version = filteredData[2];
      };

      return browser;
    },

    /*
    *  
    */
    getOS: function(){
      var ua = navigator.userAgent;

      var os = ua.match(/Win|Mac|X11|Linux/i) || [];

      var result = null;

      if (os.length > 0) {
        var result = hardware.OSList[os];
      };

      return result;
    }
  };

  var utils = {

    /*
    * Return all visits objects since connection is active
    */
    getSessionVisits: function(){
      var session = []
      var archives = dataArchives;
      // archives.push(data);

      for (var i = archives.length - 1; i >= 0; i--) {
        var currentSessionStart = new Date( archives[i].date ).getTime();

        var currentSessionEnd = currentSessionStart + archives[i].visitDuration

        if (archives[i].hiddenTime) {
          currentSessionEnd += archives[i].hiddenTime;
        };

        if (archives[i+1]) {
          var nextSessionStart = new Date( archives[i+1].date ).getTime();

          if ( time.pagesViewsOverlap(currentSessionEnd, nextSessionStart) ) {
            session.push(archives[i]);
          } else {
            return session;
          }
        };
      };

      return session;
    },

    /*
      Credit: @orip
      http://stackoverflow.com/q/1353684
    */
    isValidDate: function(d) {
      if ( Object.prototype.toString.call(d) !== "[object Date]" )
        return false;
      return !isNaN(d.getTime());
    },

    /*
      Return the average interval between visits
    */
    getAverageIntervalBetweenVisits: function(){
      var intervals = [];

      for (var i = 0; i < dataArchives.length; i++) {

        if ( dataArchives[i+1] ) {

          var date = new Date( dataArchives[i].date );
          var date2= new Date( dataArchives[i+1].date );

          var interval = date2.getTime() - date.getTime();

          intervals.push( interval );
        };
      };

      var total = 0;

      for (var i = 0; i < intervals.length; i++) {
        total += intervals[i];
      };

      total = total/intervals.length;
      
      return total;
    }
  };

  function initData() {
    data = {};

    var previousVisitData = JSON.parse(localStorage.getItem("awareJs-current"));

    dataArchives = JSON.parse(localStorage.getItem("awareJs-archives")) || [];

    if (previousVisitData) {
      dataArchives.push(previousVisitData);

      data.firstVisit = false;
      data.lastVisitDate = previousVisitData.date;
    } else {
      data.first_visit = true;
    }

    data.geolocation = null;

    data.date = new Date();
    data.visitDuration = 0;

    data.timeslot = time.getTimeSlot();
  }

  function initCustomData(customData) {

    debugMode = true;

    data = customData.splice(customData.length - 1, 1)[0];

    dataArchives = customData;

    data.date = new Date(data.date);
  }

  var pythia = {
  	version: 1.0,

    /**
    *  PythiaJS initialisation.
    *  Gather current session data and retrieve data history so it can be processed when needed.
    *  This method MUST be called before trying to call any other methods.
    */
    init: function () {

      initData();

      geo.init();

      behaviour.init();

      try {
        localStorage.setItem("awareJs-current", JSON.stringify(data));
        localStorage.setItem("awareJs-archives", JSON.stringify(dataArchives));
      } catch (e) {
        console.error(e);
      }
    },

    /**
    *  PythiaJS developement initialisation.
    *  This is usefull to test how your program behave with different context than your own
    */
    initCustomData: function (data) {
      geo.clearGeolocationWatcher();
      initCustomData(data);
    },

    /**
    *	Returns true if it is the first time the suer visits the site, false otherwise
    * @returns {boolean}
    */
    isFirstVisit: function () {
      return data.firstVisit;
    },

    getVisits: function () {
      return dataArchives;
    },

    /**
    *	Returns the date of the user's last visit
    * @returns {Date}
    */
    getLastVisitDate: function () {
      return new Date(data.lastVisitDate);
    },

    /**
    *	Returns total number of visits
    * @returns {int}
    */
    getNumberOfVisits: function () {
      return dataArchives.length;
    },

    /**
    *	Returns the timeslot during the visit happens.
    * Timeslots are defined by the hour of the visit.
    * Rerefence:
    * 0h  <= visit < 6h  // night
    * 6h  <= visit < 9h  // earlymorning
    * 9h  <= visit < 12h // morning
    * 12h <= visit < 15h // midi
    * 15h <= visit < 18h // afternoon
    * 18h <= visit < 24h // evening
    * @returns {string}
    */
    getCurrentTimeSlot: function (hours) {
      return time.getTimeSlot(hours);
    },

    /**
    *	Returns the number of visits since dateArg
    * -dateArg (optional, default all time) must be a Date object or at leasdt convertible to a Date object
    * {@returns int}
    */
    getNumberOfVisitsSince: function (dateArg) {
      var visits = time.getVisitsSince(dateArg);
      return visits.length;
    },

    /**
    * Returns the time ellapsed since last visit in MS
    * {@returns int}
    */
    getTimeSinceLastConnection: function () {
      var lastVisitTimestamp = new Date(data.lastVisitDate).getTime();
      var nowTimestamp = new Date().getTime();

      var timeSinceLastVisit = nowTimestamp - lastVisitTimestamp;

      return timeSinceLastVisit;
    },

    /**
    * Returns the duration of the last visit in MS or null if current visit is the first visit ever
    * {@returns int || null}
    */
    getLastVisitDuration: function () {
      var length = dataArchives.length;
      return dataArchives[length - 1] ? dataArchives[length - 1].visitDuration : null;
    },

    /**
    * @TOFIX : Je crois que tout pète si dataArchives est vide
    * Return (in milliseconds) the average visit duration in MS.
    * -start: date from wich we want to calculate the average duration
    * {@returns int}
    */
    getAverageVisitDuration: function (start) {

      /*var dataArchives = dataArchives;
      if (!utils.isValidDate(start)) {
        throw new Error(libname + " - getAverageVisitDuration(): Arg 'start' must be a Date object or at least convertible to a Date object.");
        return;
      };*/

      var startTimestamp = start ? new Date(start).getTime() : new Date(dataArchives[0].date).getTime();

      var archiveLength = dataArchives.length;
      var totalVisitDuration = 0;
      var numberOfVisits = 0;

      for (var i = 0; i < archiveLength; i++) {
        var visitTimestamp = new Date(dataArchives[i].date).getTime();

        if (visitTimestamp >= startTimestamp) {
          numberOfVisits += 1;
          totalVisitDuration += dataArchives[i].visitDuration;
          console.log(dataArchives[i].visitDuration);
        };
        
      };

      return totalVisitDuration/numberOfVisits;
    },

    /**
    *  Returns an array of objects where each object describe a day with two properties:
    *  averageDuration: the average visit duration for the day in MS
    *  day: name of the day
    *  {@returns array}
    */
    getAverageVisitDurationPerDay: function(){
      var archivesLength = dataArchives.length;
      var averageVisitDurationPerDay = [];
      
      week = {
        "0" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'dimanche'
        },
        "1" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'lundi'
        },
        "2" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'mardi'
        },
        "3" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'mercredi'
        },
        "4" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'jeudi'
        },
        "5" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'vendredi'
        },
        "6" : {
          totalVisits: 0,
          visitsDurationSum: 0,
          dayString: 'samedi'
        }
      };

      // Run through visitsArchive, sort all visits by day, 
      for (var i = 0; i < archivesLength; i++) {

        var day = new Date( dataArchives[i].date ).getDay();
        week[day].totalVisits++;
        console.log(dataArchives[i].visitDuration);
        week[day].visitsDurationSum += dataArchives[i].visitDuration;
      };

      console.log(week);

      for( day in week ){

        if ( week.hasOwnProperty( day ) ) {
          var avgDuration = week[day].visitsDurationSum/week[day].totalVisits;

          // 0/0 //Nan
          if ( isNaN(avgDuration) ) { avgDuration = 0 };

          averageVisitDurationPerDay.push({
            'day': week[day].dayString,
            'averageDuration': avgDuration
          });
        }
      };

      averageVisitDurationPerDay.sort(function(a, b){
        if (a.average_duration > b.average_duration) { return -1 };
        if (a.average_duration < b.average_duration) { return 1 };
        return 0;
      });

      return averageVisitDurationPerDay;
    },

    /**
    *  Returns an array of objects where each object describe a timeslot with two properties:
    *  averageDuration: the average visit duration for the timeslot in MS
    *  timeslot: name of the timeslot
    *  {@returns array}
    */
    getAverageVisitDurationTimeSlot: function(){
      var archives_length = dataArchives.length;
      var averageVisitDurationPerTimeSlot = [];

      visitsDurationsPerTimeslot = {
        "night" : {
          totalVisits: 0,
          visitsDurationSum: 0
        },
        "earlymorning" : {
          totalVisits: 0,
          visitsDurationSum: 0
        },
        "morning" : {
          totalVisits: 0,
          visitsDurationSum: 0
        },
        "midi" : {
          totalVisits: 0,
          visitsDurationSum: 0
        },
        "afternoon" : {
          totalVisits: 0,
          visitsDurationSum: 0
        },
        "evening" : {
          totalVisits: 0,
          visitsDurationSum: 0
        }
      }

      for (var i = 0; i < archives_length; i++) {

        var visitTimeslot = time.getTimeSlot( new Date( dataArchives[i].date ).getUTCHours() );
        visitsDurationsPerTimeslot[visitTimeslot].totalVisits++;
        visitsDurationsPerTimeslot[visitTimeslot].visitsDurationSum += dataArchives[i].visitDuration;
      };

      for( timeslot in visitsDurationsPerTimeslot ){
        var avgDuration = visitsDurationsPerTimeslot[timeslot].visitsDurationSum/visitsDurationsPerTimeslot[timeslot].totalVisits;
        if ( isNaN(avgDuration) ) { avgDuration = 0 };
        averageVisitDurationPerTimeSlot.push({
          'timeslot': timeslot,
          'average_duration': avgDuration
        });
      };

      averageVisitDurationPerTimeSlot.sort(function(a, b){
        if (a.average_duration > b.average_duration) { return -1 };
        if (a.average_duration < b.average_duration) { return 1 };
        return 0;
      });

      return averageVisitDurationPerTimeSlot;
    },

    /**
    *  Returns an object describing the current latitude and longitude of the user if available
    *  {@returns object || null}
    */
    getPosition: function(){
      if (data.geolocation) {
        return data.geolocation.position;
      }
      return null;
    },

    /**
    *  Returns an array timeslots sorted by the number of visits for the timeslot. Each timeslot is described by two properties
    *  visits: number of visits for the timeslot
    *  timeslot: name of the timeslot
    *  {@returns array}
    */
    getFavoriteTimeslot: function(){

    	var archives_length = dataArchives.length;
      var timeslotsSortedByVisits = [];

      visitsPerTimeslot = {
        "night" : {
          visits: 0
        },
        "earlymorning" : {
          visits: 0
        },
        "morning" : {
          visits: 0
        },
        "midi" : {
          visits: 0
        },
        "afternoon" : {
          visits: 0
        },
        "evening" : {
          visits: 0
        }
      }

      for (var i = 0; i < archives_length; i++) {
        var visitTimeslot = time.getTimeSlot( new Date( dataArchives[i].date ).getUTCHours() );
        visitsPerTimeslot[visitTimeslot].visits++;
      };

      for( timeslot in visitsPerTimeslot ){
        timeslotsSortedByVisits.push({
          'timeslot': timeslot,
          'visits': visitsPerTimeslot[timeslot].visits
        });
      };

     timeslotsSortedByVisits.sort(function(a, b){
        if (a.visits > b.visits) { return -1 };
        if (a.visits < b.visits) { return 1 };
        return 0;
      });

      return timeslotsSortedByVisits;
    },

    /**
    *	Returns the number of visits for each timeslot
    * Returns an object where each key is a timeslot and it's value is the number of visits for the timeslot
    *	{@returns object}
    */
    getVisitsPerTimeslot: function(day){

      var timeslots = {
        earlymorning: 0,
        morning: 0,
        midi: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      };

      // Pour chaque visite on incrémente la propriété de l'objet "timeslot" correspondant au "timeslot" de la visite
      for (var i = 0; i < dataArchives.length; i++) {
      
        var visitDay = new Date(dataArchives[i].date).getDay();

        if (!day) {
          timeslots[dataArchives[i].timeslot] ++;
        } else if (day == visitDay){
          timeslots[dataArchives[i].timeslot] ++;
        }
      };

      return timeslots;
    },

    /**
    *  Returns an array of objects where each object represents a day.
    *  Each day is described by three properties:
    *  	day  : name of the day
    *		index: numerical id of the day (0: sunday, 1: monday, 2:tuesday ...)
    *  {@returns array}
    */
    sortDaysByVisits: function(){
      var week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      var favoriteDay = {
        day: null,
        index: null,
        visits: 0
      };

      var week = [
        {
          day: 'sunday',
          index: 0,
          visits : 0
        },
        {
          day: 'monday',
          index: 1,
          visits : 0
        },
        {
          day: 'tuesday',
          index: 2,
          visits : 0
        },
        {
          day: 'wednesday',
          index: 3,
          visits : 0
        },
        {
          day: 'thursday',
          index: 4,
          visits : 0
        },
        {
          day: 'friday',
          index: 5,
          visits : 0
        },
        {
          day: 'saturday',
          index: 6,
          visits : 0
        },
      ];

      for (var i = 0; i < dataArchives.length; i++) {
      
        var day = new Date(dataArchives[i].date).getDay();

        week[day].visits ++;
      };

      week.sort(function(a, b){
        if (a.visits > b.visits) { return -1 };
        if (a.visits < b.visits) { return 1 };
        return 0;
      });

      console.log(week);

      return week;
    },

    /**
    *	Returns true is user is considred as a daily user, returns false otherwise.
    *	If user has at least one visit for each days since the accuracy param
    * {@returns array}
    * {@returns bool}
    */
    isDailyUser: function(accuracy){
      if (!accuracy) { accuracy = 7 };

      visitsSortedByDay = time.sortVisitsByDay();

      // Fuzzy things up a little bit
      // for example, if accuracy is set to 10 and user have only visited the site 9 days in a row, user is stille considered as a daily user
      var ratio = time.getUserVisitRatio(accuracy);
			var isDailyuser = ratio > 0.9 ? true : false;

      return isDailyuser;
    },

    /**
    *  Returns the number of pages seen for the current session
    *  {@returns int}
    */
    getSessionPageviews: function(){
      var session = utils.getSessionVisits();

      return session.length;
    },

    /**
    * Returns the time spent per page for each visits of the current session
    * {@returns array}
    */
    getSessionTimeSpentPerPage: function(){
      var session = utils.getSessionVisits();

      var timePerPage = [];

      for (var i = 0; i < session.length; i++) {
        timePerPage.push(session[i].visitDuration);
      };

      return timePerPage;
    },

    /**
    *	Returns a list of the geographic places when the user have the most visits, sorted by visits
    * For simplification purposes, each place is rounded to 10km
    * Each place is described by three properties:
    * 	- lat: the place latitude
    *		- long: the place longitude
    *		- visits: the number of visits registered for this particular place
    * {@returns array}
    */
    getFavoritePlaces: function(){
      /*Source: http://gis.stackexchange.com/a/8655

      decimal
      places   degrees          distance
      -------  -------          --------
      0        1                111  km
      1        0.1              11.1 km
      2        0.01             1.11 km
      3        0.001            111  m
      4        0.0001           11.1 m
      5        0.00001          1.11 m
      6        0.000001         11.1 cm
      7        0.0000001        1.11 cm
      8        0.00000001       1.11 mm*/

      var placesRanking = {};

      for (var i = 0; i < dataArchives.length; i++) {
        var visit = dataArchives[i];
        if (visit.geolocation) {

          var placeId = geo.getApproximatePositionAsString( visit.geolocation.position );
          placesRanking = geo.updateRanking(placeId, placesRanking);

          if (visit.geolocation.hasMoved) {
            for (var e = 0; e < visit.geolocation.position_history.length; e++) {
              var placeId = geo.getApproximatePositionAsString( visit.geolocation.position_history[e] );
              placesRanking = geo.updateRanking(placeId, placesRanking);
            };
          };
        };
      };

      var podiumTemp = [];
      var podium     = [];

      for (var place in placesRanking) {
          if (placesRanking.hasOwnProperty(place)) {
            podiumTemp.push( [place, placesRanking[place]] );
          }
      }

      podiumTemp.sort(function (a, b){ return a[1] - b[1] });

      for (var i = 0; i < podiumTemp.length; i++) {

        var place = podiumTemp[i][0];

        var start = place.indexOf('lat')+3;
            var end   = place.indexOf('lon');
            var lat   = parseFloat( place.substring(start, end) );
            var lon   = parseFloat( place.substring(end+3) );

        podium.unshift({
          'lat': lat,
          'lon': lon,
          'visits': podiumTemp[i][1]
        });
      };

      return  podium;
    },

    /**
    *	Returns the average timelapse between each visits in MS
    * {@returns int}
    */
    getAverageIntervalBetweenVisits: function(){
      var intervals = [];
      var intervalTotal = 0;
      var intervalsSum = 0;

      for (var i = dataArchives.length - 1; i >= 0; i--) {
        if (dataArchives[i].lastVisitDate) {
          var currentVisiteDate = new Date( dataArchives[i].date );
          var lastVisiteDate    = new Date( dataArchives[i].lastVisitDate );

          var diff = currentVisiteDate.getTime() - lastVisiteDate.getTime();

          intervalTotal++;
          intervalsSum += diff;
        };
      };

      total = intervalsSum/intervalTotal;
      
      return total;
    },

    /**
    *	Returns ratio of read pages per viewed pages for the current session
    * {@returns int}
    */
    getPageViewedPageReadRatio: function(){
      var session = utils.getSessionVisits();

      var howManyPagesHaveBeenRead = 0;

       for (var i = session.length - 1; i >= 0; i--) {
         if (session[i].pageBottomReached) { howManyPagesHaveBeenRead++ };
       };

       return session.length/howManyPagesHaveBeenRead;
    },

    /**
    *	Returns the number of read pages for the current session
    * {@returns int}
    */
    getSessionViewedPagesNumber: function(){
      var session = utils.getSessionVisits();

      var howManyPagesHaveBeenRead = 0;

       for (var i = session.length - 1; i >= 0; i--) {
         if (session[i].pageBottomReached) { howManyPagesHaveBeenRead++ };
       };

       return howManyPagesHaveBeenRead;
    },

    /**
    *	Returns true if the user is using a mobile device, returns false otherwise
    * {@returns bool}
    */
    isMobile: function(){
      return hardware.isMobile();
    },

    /**
    *  Returns an array of days, sorted by user attention ratio.
    *  Each day is described by four properties:
    *  	day  : name of the day
    *		index: numerical id of the day (0: sunday, 1: monday, 2:tuesday ...)
    *		pageRead: number of pages that have been read for this particular day
    *		pageViews: number of pages that have been read for this particular day
    *		ratio: pagesRead/pagesViews ratio
    *  {@returns array}
    */
    sortDaysByUserAttention: function(){
      var total_days = 0;

      var visitsPerDate = time.sortVisitsByDay();

      var tempDateObj = new Date();

      var days = {
        "1" : {
          day : 'lundi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 1
        },
        "2" : {
          day : 'mardi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 2
        },
        "3" : {
          day : 'mercredi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 3
        },
        "4" : {
          day : 'jeudi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 4
        },
        "5" : {
          day : 'vendredi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 5
        },
        "6" : {
          day : 'samedi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 6
        },
        "0" : {
          day : 'dimanche',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          index: 0
        }
      }

      for (var key in visitsPerDate) {
        if (visitsPerDate.hasOwnProperty(key)) {
          var visits = visitsPerDate[key];
          var dayRef = new Date(visits[0].date).getDay();

          days[dayRef].pageViews += visits.length;

          for (var i = visits.length - 1; i >= 0; i--) {
            if (visits[i].pageBottomReached) { days[dayRef].pageRead ++ };
          };

          days[dayRef].ratio = days[dayRef].pageRead/days[dayRef].pageViews;
        }
      };

      var sortedDays = [];

      for (day in days) {
        sortedDays.push(days[day]);
      };

      sortedDays.sort(function(a, b){
        if (a.ratio > b.ratio) { return -1 };
        if (a.ratio < b.ratio) { return 1 };
        return 0;
      });

      return sortedDays;
    },

    sortUserAttentionRatioPerTimeslot: function(){
      var timeslots_counters = {
        night: [],
        earlymorning: [],
        morning: [],
        midi: [],
        afternoon: [],
        evening: [],
      };

      // Pour chaque visite, on push la propriété pageBottomReached (null || true) de la visite 
      // dans la propriété de timeslots_counters correspondant au timeslot de la visite
      for (var i = 0; i < dataArchives.length; i++) {
        timeslots_counters[dataArchives[i].timeslot].push(dataArchives[i].pageBottomReached);
      };

      var timeslots = {
        earlymorning: {
          timeslot : 'earlymorning',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 0
        },
        morning: {
          timeslot : 'morning',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 1
        },
        midi: {
          timeslot : 'midi',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 2
        },
        afternoon: {
          timeslot : 'afternoon',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 3
        },
        evening: {
          timeslot : 'evening',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 4
        },
        night: {
          timeslot : 'night',
          pageViews : 0,
          pageRead: 0,
          ratio: 0,
          timeslot_index: 5
        },
      };

      for (var timeslot in timeslots_counters) {
        if (timeslots_counters.hasOwnProperty(timeslot)) {

          timeslots[timeslot].pageViews = timeslots_counters[timeslot].length;

          for (var i = 0; i < timeslots_counters[timeslot].length; i++) {
            if (timeslots_counters[timeslot][i]) {
              timeslots[timeslot].pageRead ++;
            };
          };

          if (timeslots[timeslot].pageViews==0) {
            timeslots[timeslot].ratio = 0;
          } else {
            timeslots[timeslot].ratio = timeslots[timeslot].pageRead/timeslots[timeslot].pageViews;
          }
          
        }
      };

      sortedTimeSlots = [];

      for (var timeslot in timeslots_counters) {
        sortedTimeSlots.push( timeslots[timeslot] );
      };

      sortedTimeSlots.sort(function(a, b){
        if (a.ratio > b.ratio) { return -1 };
        if (a.ratio < b.ratio) { return 1 };
        return 0;
      });

      return sortedTimeSlots;
    },

    getBrowser: function(){
      return hardware.getBrowser();
    },

    getOS: function(){
      return hardware.getOS();
    }
	};

  ctx.pythia = pythia;

})(window);