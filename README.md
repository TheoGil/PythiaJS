![PythiaJS](http://i.imgur.com/y2bCJrs.jpg "PythiaJS")
# PythiaJS v1.0
Agnostic tool for user context detection and interpretation.

## Important disclaimer
PythiaJS retrieve data about the user and store it in the user's browser via localStorage to analyse it and detect contextual information, behavioral patterns... As all the data is stored within the user's browser, it can be modified, deleted and thus is not 100% relialable. Always use data from PythiaJS with caution.

## Getting started
Include PythiaJS into your HTML file(s)

```
<script type="text/javascript" src="pythia.min.js"></script>
```
Initialise the PyhtiaJS by calling the init method
```
pyhtia.init()
```

## What is it for?
TODO

## How does it work?
TODO

## Documentation
### getAverageIntervalBetweenVisits()
Return the average interval between visits in milliseconds.
### getAverageVisitDuration(start)
Return the average visit duration in milliseconds.
start (optional): date from wich we want to calculate the average duration. Default: first visit ever.
### getAverageVisitDurationPerDay()
Return an array of objects where each object describe a day with two properties:
* averageDuration: the average visit duration for the day in MS
* day: name of the day
### getAverageVisitDurationPerTimeslot()
Return an array of objects where each object describe a timeslot with two properties:
* averageDuration: the average visit duration for the timeslot in MS
* timeslot: name of the timeslot

### getBrowser()
Return an object describing the detected browser of the user with two properties:
* browser: the browser name
* version: the browser version

### getCurrentTimeSlot()
Return the current visit's timeslot.
* 0h  <= visit < 6h  | night
* 6h  <= visit < 9h  | earlymorning
* 9h  <= visit < 12h | morning
* 12h <= visit < 15h | midi
*  15h <= visit < 18h | afternoon
*  18h <= visit < 24h | evening

###getFavoritePlaces()
Return a list of the geographic places when the user have the most visits, sorted by visits.
For simplification purposes, each place is rounded to 10km.
Each place is described by three properties:
* lat: the place latitude
* long: the place longitude
* visits: the number of visits registered for this particular place

### getFavoriteTimeSlot()
Return an array timeslots sorted by the number of visits for the timeslot. Each timeslot is described by two properties
* visits: number of visits for the timeslot
* timeslot: name of the timeslot

### getLastVisitDate()
Return the date of the user's last visit

### getLastVisitDuration()
Return the duration of the last visit in MS or null if current visit is the first visit ever

### getNumberOfVisits
getNumberOfVisits

### getOS
Return the user's detected OS

### getPageViewedPageReadRatio()
Return ratio of read pages per viewed pages for the current session

### getPosition()
Return an object describing the current latitude and longitude of the user if available

### getSessionPageViews()
Return the number of pages seen for the current session

### getSessionTimeSpentPerPage()
Return the time spent per page for each visits of the current session

### getSessionViewedPagesNumber()
Return the number of read pages for the current session

### getTimeSinceLastConnection()
Return the time ellapsed since last visit in milliseconds.

### getVisitsPerTimeslot()
Return the number of visits for each timeslot.

### init()
PythiaJS initialisation.
Gather current session data and retrieve data history so it can be processed when needed.
This method MUST be called before trying to call any other methods.

### initCustomData()
PythiaJS developement initialisation.
This is usefull to test how your program behave with different context than your own.

### isDailyUser()
Return true is user is considred as a daily user, Return false otherwise.
If user has at least one visit for each days since the accuracy param.

### isFirstVisit()
Return true if it is the first time the suer visits the site, false otherwise.

### isMobile()
Return true if the user is using a mobile device, Return false otherwise

### sortDaysByUserAttention()
Return an array of days, sorted by user attention ratio.
Each day is described by four properties:
* day  : name of the day
* index: numerical id of the day (0: sunday, 1: monday, 2:tuesday ...)
* pageRead: number of pages that have been read for this particular day
* pageViews: number of pages that have been read for this particular day
* ratio: pagesRead/pagesViews ratio

### sortDaysByVisits()
Return an array of objects where each object represents a day.
Each day is described by three properties:
* day  : name of the day
* index: numerical id of the day (0: sunday, 1: monday, 2:tuesday ...)

### sortUserAttentionRatioPerTimeSlot()
Return an array of timeslots, sorted by user attention ratio.
Each timeslot is described by four properties:
* timeslot  : name of the timeslot
* pageRead: number of pages that have been read for this particular timeslot
* pageViews: number of pages that have been read for this particular timeslot
* ratio: pagesRead/pagesViews ratio

### version
Return the version of the PythiaJS used.
