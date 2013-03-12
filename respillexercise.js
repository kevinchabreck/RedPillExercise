var util = require('util');
var fs = require('fs');

/**@program RedPillExercise
  *@author  Kevin Chabreck
  *@date    3/12/2013
  *@description This program reads a local file named '1000-snapshots-overlap-with-Feb-2012.json',
  *             parses the data into an array of "Snapshots," and processes the array to answer 3
  *             different questions: 1. During the month of February 2012, how long is spent on each 
  *                                     piece of work?
  *                                  2. What if we only count time during the working hours of Mon-
  *                                     Fri, 9am-5pm (Zulu time)?
  *                                  3. How long is spent in total in each ScheduleState (across all 
  *                                     pieces of work), taking account of working hours?
  *             
  *              **(I wasn't exactly sure if #3 wanted the total times as well as the total working hours,
  *                 so I included them both in the output)
  */

//Global variables defining increments of time used throughout the
//program, as well as Date objects for the beginning and end of the
//month of February, 2012
var febStartDate = new Date("February 1, 2012 00:00:00:000Z");  
var febEndDate = new Date("March 1, 2012 00:00:00:000Z");       
var oneMS = 1;
var oneSecond = oneMS*1000;
var oneMinute = oneSecond*60;
var oneHour = oneMinute*60;
var oneDay = oneHour*24;
var oneWeek = oneDay*7;
var oneYear = oneWeek*52;

/**@function    processSnapshots
  *@description The driver function for this coding exercise. Populates snapshotArray
  *             with the provided data set using grabArray, and passes it to 
  *             processFebruaryProjects and processScheduleStates. processSnapshots is
  *             called at the end of the program to begin processing data.
  */
function processSnapshots(){
    var snapshotArray = grabArray('1000-snapshots-overlap-with-Feb-2012.json');
    processFebruaryTime(snapshotArray);
    processScheduleStates(snapshotArray);
}

/**@function    grabArray
  *@description reads a local .json file named filename, and decodes it with the 
  *             javascript JSON parser. Returns the resulting array.
  *
  *@param  filename:  the name of the .json file to read
  *@return array:     the array built from the parsed .json file.  
  */
function grabArray(filename){
    var array = JSON.parse(fs.readFileSync(filename));
    return array;
}

/**@function    processFebruaryTime
  *@description Iterates through snapshotArray and gets info about the time spent on
  *             the project identified by the snapshot. Snapshots are only processed if
  *             their _ValidFrom and _ValidTo fields overlap the month of February, 2012,
  *             (either in part or in whole). The projectTimeArray is populated with a
  *             timeObject object for each applicable project, and is printed to the 
  *             screen once all snapshots have been processed.
  *
  *@param  snapshotArray:  an array containing the snapshots fetched from the supplied
  *                        data set.
  */
function processFebruaryTime(snapshotArray){
    var projectTimeArray = new Array();
    var projectTime;
    for(var i=0; i<snapshotArray.length; i++){
        if(validDuringFebruary(snapshotArray[i])){
            projectTime = getProjectTime(snapshotArray[i]);
            projectTimeArray = addTime(projectTimeArray, projectTime);
        }
    }
    util.print("\n**Number of projects active in FEBRUARY, 2012: ",projectTimeArray.length,"**");
    displayTime(projectTimeArray,"total","project");
    displayTime(projectTimeArray,"work","project");
}

/**@function    processScheduleStates
  *@description Iterates through snapshotArray and gets info about the time spent in
  *             the ScheduleState identified by the snapshot. Every snapshots is processed,
  *             even if the _ValidTo state indicates that an item is still being worked on.
  *             scheduleStateArray is populated with timeObject objects that hold information 
  *             on every unique ScheduleState (such as the total ammount of time spent in each
  *             one, and the ammount of that time that took place during standard business 
  *             hours). scheduleStateArray is printed to the screen once all snapshots have
  *             been processed.
  *
  *@param  snapshotArray:  an array containing the snapshots fetched from the supplied
  *                        data set.                                                                                      
  */
function processScheduleStates(snapshotArray){
    var scheduleStateArray = new Array();
    var scheduleStateTime;
    for(var i=0; i<snapshotArray.length; i++){
        scheduleStateTime = getScheduleStateTime(snapshotArray[i]);
        scheduleStateArray = addTime(scheduleStateArray, scheduleStateTime);
    }
    util.print("\n**Total number of schedule states: ",scheduleStateArray.length,"**");
    displayTime(scheduleStateArray,"total","Schedule State");
    displayTime(scheduleStateArray,"work","Schedule State");
}

/**@function    validDuringFebruary
  *@description a helper function for the processFebruaryTime function. Takes a snapshot as
  *             input, and determines if the timeframe indicated its _ValidFrom and _ValidTo
  *             dates falls within the month of February, 2012. Returns a boolean result 
  *             indicating the validity of the recieved snapshot.
  *
  *@param  snapshot:  the snapshot to be analyzed.
  *@return validity:  indicates whether any part of the snapshot's timeframe occurs during
  *                   the month of February, 2012. 
  */
function validDuringFebruary(snapshot){
    var validity = false;
    var validFrom = new Date(snapshot._ValidFrom);
    var validTo = new Date(snapshot._ValidTo);
    if(validTo.getFullYear() == 9999)
	validTo = new Date();
    var validFromTime = validFrom.getTime();
    var validToTime = validTo.getTime();
    var febStartTime = febStartDate.getTime();         //the earliest possible timestamp of February 2012
    var febEndTime = febEndDate.getTime();             //the latest possible timestamp of February 2012
    //compares month to 1 because JS months are zero-based; 0 = Jan, 1 = Feb, etc.
    if(validFrom.getMonth()==1 && validFrom.getFullYear()==2012)
	validity = true;
    else if(validTo.getMonth()==1 && validTo.getFullYear()==2012)
	validity = true;
    //checks for the condition where a project timeframe completely overlaps February 2012
    else if((validFromTime < febStartTime)&&(validToTime >febEndTime))
	validity = true;
    return validity;
}

/**@function    getProjectTime
  *@description recieves a snapshot that has a timeframe valid during February, 2012. If
  *             _ValidFrom or _ValidTo are outside the scope of February, 2012, they are
  *             reassigned to febStartDate or febEndDate in order to only process the 
  *             hours taking place during February. Calls getTotalTime and getWorkTime to
  *             get the total time, and the total time during business hours in February, 
  *             2012. Uses these values to build a TimeObject called projectTime coresponding 
  *             to the snapshot's ObjectID. projectTime is returned at the end of the function. 
  *
  *@param  snapshot:    the snapshot being processed.
  *@return projectTime: an TimeObject holding the project's ObjectID, total time, and 
  *                     total work time during February, 2012.             
  */
function getProjectTime(snapshot){
    var validFrom = new Date(snapshot._ValidFrom);
    var validTo = new Date(snapshot._ValidTo);
    var validFromTime = validFrom.getTime();
    var validToTime = validTo.getTime();
    var febStartTime = febStartDate.getTime(); //the earliest possible timestamp of February 2012
    var febEndTime = febEndDate.getTime();     //the latest possible timestamp of February 2012
    //if either validFrom or validTo are not in February, they are set to the closest valid date
    if(validFromTime < febStartTime)
        validFrom = febStartDate;
    if(validToTime > febEndTime)
        validTo = febEndDate;
    var projectID = snapshot.ObjectID;
    var totalTime = getTotalTime(validFrom,validTo);
    var workingHoursTime = getWorkingHoursTime(validFrom, validTo);
    var projectTime = new TimeObject(projectID,totalTime,workingHoursTime);
    return projectTime;
}


/**@function    getScheduleStateTime
  *@description recieves a snapshot, and calls getTotalTime and getWorkTime to find how 
  *             long the project occupied the given ScheduleState. Builds and returns a 
  *             TimeObject called scheduleStateTime using the ScheduleState for the ID.
  *             If the _ValidTo field indicates the project is still currently in that 
  *             ScheduleState, validTo is replaced with the current date/time.
  *
  *@param  snapshot:          the snapshot being processed.
  *@return scheduleStateTime: a TimeObject holding the total time and total buisness hours
  *                           the project occupied a certain ScheduleState.
  */
function getScheduleStateTime(snapshot){
    var validFrom = new Date(snapshot._ValidFrom);
    var validTo = new Date(snapshot._ValidTo);
    //if the snapshot is still in progress, validTo is replaced with the current date/time
    if(validTo.getUTCFullYear() == 9999)
        validTo = new Date();
    var validFromTime = validFrom.getTime();
    var validToTime = validTo.getTime();
    var state = snapshot.ScheduleState;
    var totalTime = getTotalTime(validFrom,validTo);
    var workingHoursTime = getWorkingHoursTime(validFrom, validTo);
    var scheduleStateTime = new TimeObject(state,totalTime,workingHoursTime);
    return scheduleStateTime;
}

/**@function    getTotalTime
  *@description takes two Date objects called validFrom and validTo, and subtracts the 
  *             difference in time between them in order to find the total elapsed 
  *             time.
  *             
  *@param  validFrom:  the starting Date of the time period to calculate.
  *@param  validTo:    the ending Date of the time period to calculate.
  *@return totalTime:  the difference in time between validFrom and validTo.
  */
function getTotalTime(validFrom,validTo){
    var validFromTime = validFrom.getTime();
    var validToTime = validTo.getTime();
    var totalTime = validTo.getTime() - validFrom.getTime();
    return totalTime;
}

/**@function    getWorkingHoursTime
  *@description takes two Date objects called validFrom and validTo, and counts the 
  *             ammount of time elapsed between them that took place during standard
  *             buisness hours (Mon-Fri, 9am - 5pm).
  *
  *@param  validFrom:    the starting Date of the time period to calculate.
  *@param  validTo:      the ending Date of the time period to calculate.
  *@return businessTime: the business hours (Mon-Fri, 9am - 5pm) that elapsed between
  *                      validFrom and validTo.
  */
function getWorkingHoursTime(validFrom,validTo){
    var validFromTime = validFrom.getTime();
    var validToTime = validTo.getTime();
    var businessTime = 0;
    var done = false;
    while(!done){
	//check if there is at least a week remaining between validFromTime and validToTime
	if((validFromTime + oneWeek) <= validToTime){
	    validFromTime += oneWeek;      //increment validFromTime by one week
	    businessTime += (40*oneHour);  //incrememnt buisness time by one work week
	}
	//if less than a week remains, check if there is at least a day remaining between 
	//validFromTime and validToTime.
	else if((validFromTime + oneDay) <= validToTime){
	    //check if either validFromTime or validFromTime + oneDay are non-business days (saturday
	    //or sunday). Increment validFromTime and businessTime appropriately. 
	    if(isBusinessDay(validFromTime) && isBusinessDay(validFromTime + oneDay)){
		validFromTime += oneDay;
                businessTime += (8 * oneHour);
	    }
	    else if(isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneDay)){
		businessTime += getTimeBefore5(validFromTime);
		validFromTime += oneDay;
	    }
	    else if(!isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneDay)){
		validFromTime += oneDay;
		businessTime += getTimeAfter9(validFromTime);
	    }
	    else if(!isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneDay))
		validFromTime += oneDay;
	}
	//if less than a day remains, check if there is at least an hour remaining between 
	//validFromTime and validToTime.
	else if((validFromTime + oneHour) <= validToTime){
	    //check if validFromTime and validFromTime + oneHour fall within the scope of a work
	    //day. Increment validFromTime and businessTime appropriately.
            if(isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneHour)){
                validFromTime += oneHour;
                businessTime += oneHour;
	    }
            else if(isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneHour)){
                businessTime += getTimeBefore5(validFromTime);
		validFromTime += oneHour;
            }
            else if(!isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneHour)){
                validFromTime += oneHour;
                businessTime += getTimeAfter9(validFromTime);
	    }
            else if(!isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneHour))
                validFromTime += oneHour;
        }
	//if less than an hour remains, check that there is at least one minute remaining between
	//validFromTime and validToTime.
	else if((validFromTime + oneMinute) <= validToTime){
            //check if validFromTime and validFromTime + oneMinute fall within the scope of a work
	    //day. Increment validFromTime and businessTime appropriately.
	    if(isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneMinute)){
                validFromTime += oneMinute;
                businessTime += oneMinute;
	    }
            else if(isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneMinute)){
                businessTime += getTimeBefore5(validFromTime);
		validFromTime += oneMinute;
            }
            else if(!isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneMinute)){
                validFromTime += oneMinute;
                businessTime += getTimeAfter9(validFromTime);
	    }
            else if(!isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneMinute))
                validFromTime += oneMinute;
        }
	//if less than a minute remains, check that there is at least one second remaining between
	//validFromTime and validToTime
	else if((validFromTime + oneSecond) <= validToTime){
            //check if validFromTime and validFromTime + oneSecond fall within the scope of a work
	    //day. Increment validFromTime and businessTime appropriately.
	    if(isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneSecond)){
                validFromTime += oneSecond;
                businessTime += oneSecond;
	    }
            else if(isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneSecond)){
                businessTime += getTimeBefore5(validFromTime);
		validFromTime += oneSecond;
            }
            else if(!isBusinessHour(validFromTime) && isBusinessHour(validFromTime + oneSecond)){
                validFromTime += oneSecond;
                businessTime += getTimeAfter9(validFromTime);
	    }
            else if(!isBusinessHour(validFromTime) && !isBusinessHour(validFromTime + oneSecond))
                validFromTime += oneSecond;
        }
	//if less than one second remains, check that there is at least another millisecond remaining
	//between validFromTime and validFromTime + oneMS. 
	else if(validFromTime + oneMS <= validToTime){
	    //check if validFromTime + oneMS falls withing the scope of a work day. If so, increment
	    //both businessTime and validFromTime by one millisecond (oneMS).
	    if(isBusinessHour(validFromTime + oneMS))
		businessTime += oneMS;
	    validFromTime += oneMS;
	}
	//if no time remains between validFromTime and validToTime, all time elapsed between validFrom
	//and validTo has been accounted for. 
	else	    
	    done=true;
    }
    return businessTime;
}

/**@function    isBusinessHour
  *@description a helper function for the getWorkingHoursTime function. Takes a time
  *             as a parameter, and returns a boolean result indicating if that time
  *             falls within standard business hours (Mon - Fri, 9am - 5pm).
  *
  *@param  time:    the time to be analyzed
  *@return result:  a boolean variable indicating whether time is within the scope of
  *                 a standard work day.
  */
function isBusinessHour(time){
    var timestamp = new Date();
    timestamp.setTime(time);
    var result = false;
    if (timestamp.getUTCDay()!=0 && timestamp.getUTCDay()!=6){
	if(timestamp.getUTCHours()>=9 && timestamp.getUTCHours()<=16)
	    result=true;
	else if(timestamp.getUTCHours()==17 && timestamp.getUTCMinutes()==0 && 
		timestamp.getUTCSeconds()==0 && timestamp.getUTCMilliseconds()==0)
	    result = true;
    }
    return result;
}

/**@function    isBusinessDay
  *@description a helper function for the getWorkingHoursTime function. Takes a time 
  *             as a parameter, and returns a boolean variable indicating whether it
  *             falls on a weekday or not.
  *
  *@param  time: the time to be analyzed. 
  *@return       a boolean result indicating if time falls on a business day. True
  *              indicates a weekday. False indicates a weekend.  
  */
function isBusinessDay(time){
    var timestamp = new Date();
    timestamp.setTime(time);
    if (timestamp.getUTCDay()!=0 && timestamp.getUTCDay()!=6)
	return true;
    else
	return false;
}

/**@function    getTimeAfter9
  *@description takes a time as a parameter, and returns the difference in milliseconds 
  *             between the parameter and 9am of the same day. Will return a negative result 
  *             if the recieved time comes between midnight and 9:00:00.001am.
  *
  *@param  time: the time to subtract nineAM from
  *@return       the ammount of time in milliseconds between 9am and the supplied time. 
  */
function getTimeAfter9(time){
    var timestamp = new Date();
    timestamp.setTime(time);
    var nineAM = new Date();
    nineAM.setUTCFullYear(timestamp.getUTCFullYear());
    nineAM.setUTCMonth(timestamp.getUTCMonth());
    nineAM.setUTCDate(timestamp.getUTCDate());
    nineAM.setUTCHours(9);
    nineAM.setUTCMinutes(0);
    nineAM.setUTCSeconds(0);
    nineAM.setUTCMilliseconds(0);
    return timestamp.getTime() - nineAM.getTime();
}

/**@function    getTimeBefore5
  *@description A helper method for the getWorkingHoursTime function. Takes a time as a 
  *             parameter, and returns the difference in milliseconds between the parameter 
  *             and 5pm of the same day. Will return a negative result if the supplied time 
  *             falls between 4:49:59.999pm and midnight. 
  *
  *@param  time: the time to be subtracted from 5pm.
  *@return       the ammount of time in milliseconds between the supplied time and 5pm.
  */
function getTimeBefore5(time){
    var timestamp = new Date();
    timestamp.setTime(time);
    var fivePM = new Date();
    fivePM.setUTCFullYear(timestamp.getUTCFullYear());
    fivePM.setUTCMonth(timestamp.getUTCMonth());
    fivePM.setUTCDate(timestamp.getUTCDate());
    fivePM.setUTCHours(17);
    fivePM.setUTCMinutes(0);
    fivePM.setUTCSeconds(0);
    fivePM.setUTCMilliseconds(0);
    return fivePM.getTime() - timestamp.getTime();
}

/**@function    TimeObject
  *@description a constructor for a TimeObject. An instantiated TimeObject holds an ID field,
  *             a totalTime field, and workTime field.
  *@param  id:        used to identify a TimeObject
  *@param  totalTime: stores an elapsed time value in MS
  *@param  workTime:  stores an elapsed time value in MS
  */
function TimeObject(id,totalTime,workTime){
    this.id = id;
    this.totalTime = totalTime;
    this.workTime = workTime;
}

/**@function    addTime
  *@description takes a TimeObject and an array of TimeObjects as a parameter. If the recieved
  *             TimeObject is already represented in the array by another TimeObject with the
  *             same ID, its values for totalTime and workTime are added to the existing 
  *             TimeObject. If it is not there, or the array is empty, timeObject is added to
  *             the array. addTime returns the updated TimeObject array.
  *
  *@param  array:      an array of TimeObjects
  *@param  timeObject: a TimeObject to be either inserted in the array or have its totalTime and
  *                    workTime values added to an existing TimeObject of the same ID.                                
  */
function addTime(array, timeObject){
    if(array.length == 0)
        array[0] = timeObject;
    else{
	var index=0;
	while(index<array.length){
	    if(array[index].id == timeObject.id)
		break;
	    else
		index++;
	}
	if(index==array.length)
	    array.push(timeObject);
	else{
	    array[index].totalTime += timeObject.totalTime;
	    array[index].workTime += timeObject.workTime;
	}
    }
    return array;
}

/**@function    displayTime
  *@description takes an array of TimeObjects as a parameter, and prints their
  *             ID field and either totalTime or workTime, depending on the value 
  *             of another parameter called flag. Uses the type parameter to identify 
  *             to the user what kind of array has been passed/is being printed.  
  *             
  *@param array: an array of type TimeObject to be printed to the screen. 
  *@param flag:  a string indicating which field of the TimeObject items
  *              should be printed (either 'total', for totalTime, or 'work', for workTime)
  */
function displayTime(array,flag,type){
    if(flag=="total"){
	util.print("\n                               Time devoted to each ",type," (total):\n");
	util.print("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n");
	var totalTime;
        for(var i=0; i<array.length; i++){
	    totalTime = convertToString(array[i].totalTime);
	    if(totalTime != "")
		util.print("Total time for ",type," \"",array[i].id,"\": " + totalTime + "\n");
	}
    }
    else if(flag=="work"){
	util.print("\n\n                          Time devoted to each ",type," (Business Hours):\n");
	util.print("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n");
	var workTime;
        for(var i=0; i<array.length; i++){
	    workTime = convertToString(array[i].workTime);
	    if(workTime != "")
		util.print("Time during work hours for ",type," \"",array[i].id,"\": " + workTime + "\n");
	}
    }
}

/**@function    convertToString
  *@description a helper function for the displayTime function. Takes as input a 
  *             time in milliseconds, and simplifies it into larger increments if
  *             it is equal to at least one second.
  *
  *@param  time:       the time in milliseconds to be converted to a string 
  *@return timeString: the simplified, String representation of the parameter 'time'.
  */
function convertToString(time){
    var years = Math.floor(time/oneYear);
    time = time % oneYear;
    var weeks = Math.floor(time/oneWeek);
    time = time % oneWeek;
    var days = Math.floor(time/oneDay);
    time = time % oneDay;
    var hours = Math.floor(time/oneHour);
    time = time % oneHour;
    var minutes = Math.floor(time/oneMinute);
    time = time % oneMinute;
    var seconds = Math.floor(time/oneSecond);
    time = time % oneSecond;
    var timeString="";
    if(years != 0)
	timeString += (years + " year(s) ");
    if(weeks != 0)
	timeString += (weeks + " week(s) ");
    if(days != 0)
	timeString += (days + " day(s) ");
    if(hours != 0)
	timeString += (hours + " hour(s) ");
    if(minutes != 0)
	timeString += (minutes + " minute(s) ");
    if(seconds != 0)
	timeString += (seconds + " second(s) ");
    if(time != 0)
	timeString += (time + " MS");
    return timeString;
}

processSnapshots();
