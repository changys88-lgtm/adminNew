function clog(val) {
	console.log(val);
}
function OpenWindow(sFile,sName,reSize,xSize,ySize,xTop,yTop){
	window.open(sFile,sName,"status=1, scrollbars="+reSize+",width="+xSize+",height="+ySize+",top="+xTop+",left="+yTop);
}
function OpenWindow2(sFile,sName,reSize,xSize,ySize,xTop,yTop){
	return window.open(sFile,sName,"scrollbars="+reSize+",width="+xSize+",height="+ySize+",top="+xTop+",left="+yTop);
	
}
function OpenWindowA(sFile,sName,reSize,xSize,ySize){
	Rc = CenterPositionSelf(xSize,ySize);
	window.open(sFile,sName,"status=1,scrollbars="+reSize+",width="+xSize+",height="+ySize+",top="+Rc[0]+",left="+Rc[1]);
}
function Num_field() { // - 포함 숫자 받아줌
	if (!(event.keyCode > 47 && event.keyCode < 58 ) && event.keyCode != 45) {
		alert("숫자만 입력하여 주세요");
		event.returnValue = false;
	}
}
function Num_field2() { // 순수하게 숫자만 받아줌
	if (!(event.keyCode > 47 && event.keyCode < 58 )) event.returnValue = false;
}
function numSeparate(Obj) { // 3자리씩 숫자 자름 ,를 붙여줌
	val = StrClear2(Obj.value);
	if (val != "") Obj.value = commaSplit(val);
	return true;
}
function Hangle_field() {
	if ( event.keyCode < 129 ) {
		alert("한글만 입력하여 주세요~~");
		event.returnValue = false;
	}
}
function English_field() {
	if ( event.keyCode >= 65 && event.keyCode <= 90 ) event.returnValue = true;
	else if ( event.keyCode >= 97 && event.keyCode <= 122 ) event.returnValue = true;
	else if ( event.keyCode == 32 ) event.returnValue = true;
	else {
		alert("영문만 입력하여 주세요~~");
		event.returnValue = false;
	}
}
function English_Field_Check(str) {
	checkCount = 0;
	for (strCount = 0 ; strCount < str.length ; strCount ++) {
		tmp = str.substring(strCount,strCount + 1);
		if (( tmp >= "a" && tmp <= "z" ) || ( tmp >= "A" && tmp <= "Z" ) || tmp == " ") {
		} else checkCount ++;
	}
	if (checkCount > 0) return false;
	else return true;
}

function BlockHangulKey(el) {
    const val = el.value;
    const clean = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
    if (val !== clean) {
        el.value = clean;
        alert("한글 입력은 불가능합니다.");
    }
}

/*
function Calendar(name,ss){
	var sFile = "../benefit/setcalendar.php?name="+name+"&ss="+ss;
	OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}
*/
function CalendarInter2(name,fname,layerName,cMode,cYear,cMonth,type,language,approach){
	ticket_type = frmForm.ticket_type.value ;
	//console.log(type)
	if (type == "3.0") {
		
	} else {
		if (document.all.DepartureCity ) {
			if (document.all.DepartureCity.style.display == "") {
				ver = browserCheck();
				if (ver == "MSIE9") document.all.DepartureCity.style.top = "361px";
				else document.all.DepartureCity.style.top = "358px";
			}
		}
	}
	cDate = eval("document."+fname+"."+name).value;
	if (name == "arrive_date") Nows = eval("document."+fname+".departure_date").value;
	else Nows = "";
	sFile = "../interline/air_calendar.php";
	sFile += "?name="+name+"&fname="+fname+"&layerName="+layerName+"&cDate="+cDate+"&Nows="+Nows;
	sFile += "&cMode="+cMode;
	sFile += "&cYear="+cYear;
	sFile += "&cMonth="+cMonth;
	sFile += "&ticket_type="+ticket_type;
	if (Number(approach) > 0 ) { // 신규 노선 신청쪽
		ticket_type = eval("document."+fname+".ticket_type").value
		sFile += "&type="+type;
		date1 = "";
		for (ix = 1; ix < Number(ticket_type) + 1 ; ix ++) {
			if (date1 != "") date1 += "/";
			date1 += eval("document."+fname+".departure_date"+ix).value;
		}
		sFile += "&date1="+date1;
	} else {
		sFile += "&type="+type;
		if (eval("document."+fname+".departure_date")) sFile += "&date1="+eval("document."+fname+".departure_date").value;
		if (eval("document."+fname+".arrive_date")) sFile += "&date2="+eval("document."+fname+".arrive_date").value;
	}
	sFile += "&approach="+approach;
	eval("document.all."+layerName).style.display = "";
	//console.log(sFile)
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}
function set_date_inter2(y,m,d,filename,fname,layerName,type,language,approach){
	if (String(m).length == 1) m = "0" + m;
	if (String(d).length == 1) d = "0" + d;
	val = y+"-"+m+"-"+d;
	//eval("document.all."+layerName).style.display = "none";
	eval("document."+fname+"."+filename).value = val;
	if (approach == "Hotel") {
		CheckDuration();
	} else if (Number(approach) > 0) {
		ticket_type = eval(fname+".ticket_type").value;
		if (ticket_type > approach) {
			approach = Number(approach) + 1;
			app = filename.substring(0,filename.length -1) + approach;
			HighLight(approach);
			CalendarInter(app,fname,layerName,'','','',type,language,approach);
		} else {
			HighLight(0);
		}
	} else if (filename == "departure_date" && eval("document."+fname+".arrive_date") && eval("document."+fname+".arrive_date").disabled == false) {
		CalendarInter2("arrive_date",fname,layerName,'','','',type,language,approach);
	} else if (filename == "arrive_date" && eval("document."+fname+".arrive_date") && eval("document."+fname+".arrive_date").disabled == false) {
		//CalendarInter2("arrive_date",fname,layerName,'','','',type,language,approach);
		$("#calendar_box").toggle();
	}	else if (filename == "departure_date") {
		CalendarInter2("departure_date",fname,layerName,'','','',type,language,approach);
	}
	return false;
}
function Calendar(name,fname,layerName){	
	var sFile = "../lib/setcalendar.php?ss=start&name="+name+"&fname="+fname+"&layerName="+layerName;
	eval("document.all."+layerName).style.display = "";
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}
function Calendar2(name,ss,mode){	
	var sFile = "../product/setcalendar2.php?name="+name+"&ss="+ss+"&mode="+mode;
	Rc = CenterPositionSelf(420,185);
	OpenWindow(sFile,"CAL",0,420,185,Rc[0],Rc[1]);
	return false;
}
function Calendar3(name,fname,mode){	
	var sFile = "../lib/setcalendar3.php?ss=start&name="+name+"&fname="+fname+"&mode="+mode;
	Rc = CenterPositionSelf(420,185);
	OpenWindow(sFile,"CAL",0,420,185,Rc[0],Rc[1]);
	return false;
}
function Calendar4(name,fname){	
	var sFile = "../lib/setcalendar4.php?ss=start&name="+name+"&fname="+fname;
	OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}
function calHide(layerName) {
	if (document.all.DepartureCity) {
		if (document.all.DepartureCity.style.display == "") document.all.DepartureCity.style.top = "12px";
	}
	eval("document.all."+layerName).style.display = "none";
}
function set_date(y,m,d,filename,fname,layerName){
	if (m < 10) m = "0" + m;
	if (d < 10) d = "0" + d;
	val = y+"-"+m+"-"+d;
	eval("document.all."+layerName).style.display = "none";
	eval("document."+fname+"."+filename).value = val;	
	return false;
}

function CalendarBasic(name,fname,layerName,cMode,cYear,cMonth,type,language,approach){
	cDate = eval("document."+fname+"."+name).value;
	if (name == "arrive_date") Nows = eval("document."+fname+".departure_date").value;
	else if (name == "end_date") Nows = eval("document."+fname+".start_date").value;
	else if (name == "CheckOut") Nows = eval("document."+fname+".CheckIn").value;
	else if (name == "checkOut") Nows = eval("document."+fname+".checkIn").value;
	else Nows = "";
	sFile = "../lib/calendar_basic.php";
	sFile += "?name="+name+"&fname="+fname+"&layerName="+layerName+"&cDate="+cDate+"&Nows="+Nows;
	sFile += "&cMode="+cMode;
	sFile += "&cYear="+cYear;
	sFile += "&cMonth="+cMonth;
	sFile += "&type="+type;
	sFile += "&approach="+approach;
	eval("document.all."+layerName).style.display = "";
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}

function CalendarInterBasic(name,fname,layerName,cMode,cYear,cMonth,type,language,approach){
	$(".city-layer").hide();
	$(".calendar-layer").show();
	$(".seat-layer").hide();
	ticket_type = document.frmForm.ticket_type.value;
	if (name == "arrive_date") Nows = eval("document."+fname+".departure_date").value;
	else Nows = "";
	if (ticket_type == "3") {
		var regex = /[^0-9]/g;
		var result = name.replace(regex, "");
		hh = (result-1) * 50;
		$("#CalendarLayer").css("top",95 + hh + "px");
		$("#CalendarLayer").css("left","10px");
		if (result > 1) Nows = eval("document."+fname+".dep_date"+(result-1)).value;
	} else {
		$("#CalendarLayer").css("top" ,"124px");
		$("#CalendarLayer").css("left","10px");
	}
	cDate = eval("document."+fname+"."+name).value;
	sFile = "../lib/calendar_inter_basic.php";
	sFile += "?name="+name+"&fname="+fname+"&layerName="+layerName+"&cDate="+cDate+"&Nows="+Nows;
	sFile += "&cMode="+cMode;
	sFile += "&cYear="+cYear;
	sFile += "&cMonth="+cMonth;
	sFile += "&type="+type;
	sFile += "&approach="+approach;
	//eval("document.all."+layerName).style.display = "";
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}

function CalendarDomeBasic(name,fname,layerName,cMode,cYear,cMonth,type,language,approach){
	$(".city-layer").hide();
	$(".calendar-layer").show();
	$(".seat-layer").hide();
	cDate = eval("document."+fname+"."+name).value;
	if (name == "arr_date") Nows = eval("document."+fname+".dep_date").value;
	else Nows = "";
	sFile = "../lib/calendar_inter_basic.php";
	sFile += "?name="+name+"&fname="+fname+"&layerName="+layerName+"&cDate="+cDate+"&Nows="+Nows;
	sFile += "&cMode="+cMode;
	sFile += "&cYear="+cYear;
	sFile += "&cMonth="+cMonth;
	sFile += "&type="+type;
	sFile += "&approach="+approach;
	//eval("document.all."+layerName).style.display = "";
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}

function CalendarHotelBasic(name,fname,layerName,cMode,cYear,cMonth,type,language,approach){
	$(".city-layer").hide();
	$(".calendar-layer").show();
	$(".seat-layer").hide();
	cDate = eval("document."+fname+"."+name).value;
	if (name == "CheckOut") Nows = eval("document."+fname+".CheckIn").value;
	else Nows = "";
	sFile = "../lib/calendar_hotel_basic.php";
	sFile += "?name="+name+"&fname="+fname+"&layerName="+layerName+"&cDate="+cDate+"&Nows="+Nows;
	sFile += "&cMode="+cMode;
	sFile += "&cYear="+cYear;
	sFile += "&cMonth="+cMonth;
	sFile += "&type="+type;
	sFile += "&approach="+approach;
	//eval("document.all."+layerName).style.display = "";
	frames['HIDE_ACTION'].document.location.href = sFile;
	//OpenWindow(sFile,"CAL",0,210,200,200,200);
	return false;
}

function set_date_basic(y,m,d,filename,fname,layerName,type,language,approach){
	if (String(m).length == 1) m = "0" + m;
	if (String(d).length == 1) d = "0" + d;
	val = y+"-"+m+"-"+d;
	eval("document."+fname+"."+filename).value = val;
	if (eval("document."+fname+".addPrice")) eval("document."+fname+".addPrice").value = approach;
	if(fname == "search_Add_order" && filename == "start_date"){
		$("#"+filename).trigger("change");
	}
	if (filename.indexOf("start_day") != -1 && document.getElementById("DateAction") ) {
		document.getElementById("DateAction").style.display = "";
	}
//	if (filename == "start_date" && type == "TRIP") {
//		CalendarBasic("end_date",fname,layerName,'','','',type,language,approach);
	if (filename == "start_date") {
		//eval("document."+fname+"."+"end_date").value = val;
		CalendarBasic("end_date",fname,layerName,'','','',type,language,approach);
	} else if (filename == "checkIn") {
		CalendarBasic("checkOut",fname,layerName,'','','',type,language,approach);
	}else if(filename == "settle_day"){
		order_num = eval("document."+fname+".order_num").value;
		orderSheetChange("orderSheet",order_num, "settle_day", val , 0);
	}else if(filename == "TL_check"){
		order_num = eval("document."+fname+".order_num").value;
		orderSheetChange("orderSheet",order_num, "TL_check", val , 0);
	} else {
		eval("document.all."+layerName).style.display = "none";
	}
	return false;
}
function set_inter_basic(y,m,d,filename,fname,layerName,type,week,approach,week2){
	if (String(m).length == 1) m = "0" + m;
	if (String(d).length == 1) d = "0" + d;
	RouteCount = "";
	val = y+"-"+m+"-"+d;
	ticketType = eval("document."+fname+".ticket_type").value;
	if (eval("document."+fname+".RouteCount")) RouteCount = eval("document."+fname+".RouteCount").value;
	eval("document."+fname+"."+filename).value = y+m+d;
	document.getElementById(filename+"_name").innerHTML = val + "("+getWeek (week) + ")";
	if (eval("document."+fname+"."+filename+"_name")) eval("document."+fname+"."+filename+"_name").value  = val + "("+getWeek (week) + ")";


	if (filename == "departure_date" && ticketType == "2") {
		arrive_date = eval("document."+fname+".arrive_date").value;
		//console.log("arrive_date "+arrive_date+" "+val);
		//if (StrClear(val) > arrive_date) {
			eval("document."+fname+".arrive_date").value = "";
			document.getElementById("arrive_date_name").innerHTML = "";
		//}
		CalendarInterBasic("arrive_date",fname,layerName,'','','',type,week,approach);
	} else if (filename == "dep_date" && ticketType == "2") {
		CalendarDomeBasic("arr_date",fname,layerName,'','','',type,week,approach);
	} else if ((filename == "arrive_date" || filename == "arr_date" || filename == "start_date") || (filename == "departure_date" && ticketType == "1") || filename.indexOf("dep_date") != -1) {
		calClose ();
	}
	sub = Number(StrClear(filename));
	if (ticketType == "3" && RouteCount > sub) {
		CalendarInterBasic("dep_date"+(sub+1),"frmForm","CalendarLayer","","","","");
	}
	return false;
}
function set_hotel_basic(y,m,d,filename,fname,layerName,type,week,approach){
	if (String(m).length == 1) m = "0" + m;
	if (String(d).length == 1) d = "0" + d;
	val = y+"-"+m+"-"+d;
	eval("document."+fname+"."+filename).value = val;
	document.getElementById(filename+"_name").innerHTML = val + "("+getWeek (week) + ")";
	//eval("document."+fname+"."+filename+"_name").value  = val + "("+getWeek (week) + ")";

	if (filename == "CheckIn") {
		CalendarHotelBasic("CheckOut",fname,layerName,'','','',type,week,approach);
	} else if (filename == "CheckOut") {
		calClose ();
	}
	return false;
}
function change_date(y,m,d,s,filename,fname,layerName){
	var now = new Date()
	var now_date = now.getDate() 
	if (s == 1){
		if (m == 1){
			y --
			m = 12	
		} else {
			m --
		}
	} else {
		if (m == 12){
			y ++
			m = 1
		} else {
			m ++
		}
	}
	var sFile = "../lib/setcalendar.php?mode=re&y="+y+"&m="+m+"&d="+now_date+"&name="+filename+"&fname="+fname+"&layerName="+layerName;
	frames['HIDE_ACTION'].document.location.href = sFile;
	//document.location.href = sFile 
}

function orderSheetChange(table,order_num, field, val , minor_num){
		sFile = "../order/add_for_order_save.php";
		sFile += "?table="+table+"&order_num="+order_num+"&field="+field+"&val="+val+"&minor_num="+minor_num;
		frames["HIDE_ACTION"].location.href = sFile;
}
function Add_Comma(Name){
    var src;
    var i; 
    var	factor; 
    var	su; 
    var	SpaceSize = 0;

    factor = Name.length % 3; 
    su     = (Name.length - factor) / 3;
    src    =  Name.substring(0,factor);

    for(i=0; i < su ; i++) {
		if((factor == 0) && (i == 0)) {       // "XXX" 인경우
			src += Name.substring(factor+(3*i), factor+3+(3*i));  
		} else {
		    src += ","  ;
			src += Name.substring(factor+(3*i), factor+3+(3*i));  
		}
    }
    Name = src; 
    return Name; 
}

// 연속된 문자열 체크
function continueWord(str, limit){ 
	var o, d, p, n = 0, l = limit==null ? 4 : limit; 
	for(var i=0; i<str.length; i++){ 
		var c = str.charCodeAt(i); 
		if(i > 0 && (p = o - c) >-2 && p < 2 && (n = p == d ? n+1 : 0) > l-3) return true; 
		d = p, o = c; 
	} 
	return false; 
} 

function trim(str){
	if (str) {
		var reg = /\s+/g; 
		return str.replace(reg,''); 
	}
	return "";
}
// 컴마(",") 자동 삭제
function Del_Comma(Name){
    var  x, ch;
    var  i=0;
    var  newVal="";
    for(x = 0; x < Name.length ; x++){
    	ch= Name.substring(x,x+1);
		if( ch != ",")  newVal += ch;
    }     
    Name =  newVal;
    return Name;
}
function Add_Comma2(Name){
    var src;
    var i; 
    var	factor; 
    var	su; 
    var	SpaceSize = 0;
    src = Name.value;
    if (src > 0) src = commaSplit(src);
	/*
    factor = Name.value.length % 3; 
    su     = (Name.value.length - factor) / 3;
    src    =  Name.value.substring(0,factor);

    for(i=0; i < su ; i++) {
		if((factor == 0) && (i == 0)) {       // "XXX" 인경우
			src += Name.value.substring(factor+(3*i), factor+3+(3*i));  
		} else {
		    src += ","  ;
			src += Name.value.substring(factor+(3*i), factor+3+(3*i));  
		}
    }
    */
    Name.value = src; 
    return true; 
}

// 컴마(",") 자동 삭제
function Del_Comma2(Name){
    var  x, ch;
    var  i=0;
    var  newVal="";

    for(x = 0; x < Name.value.length ; x++){
    	ch= Name.value.substring(x,x+1);
		if( ch != ",")  newVal += ch;
    }     
    Name.value =  newVal;
    return true;
}
function Explode(sepa,str) {
	var Aid = new Array();
	j = "";
	x = 0;
	str = String(str);	
	for (SepaNum = 0 ; SepaNum < str.length ; SepaNum ++){
		id2 = str.charAt(SepaNum);
		if (id2 == sepa) {
			Aid[x] = j;
			x++;
			j = "";
		} else {
			if (id2 != "") j += id2;
		}
	}
	Aid[x] = j;
	return Aid;
}
function getCookie(name) {
    var nameOfCookie = name + "=";
    var x = 0
    while ( x <= document.cookie.length )
    {
        var y = (x+nameOfCookie.length);
        if ( document.cookie.substring( x, y ) == nameOfCookie )
        {
            if ( (endOfCookie=document.cookie.indexOf( ";",y )) == -1 )
                endOfCookie = document.cookie.length;
            return unescape( document.cookie.substring(y, endOfCookie ) );
        }
        x = document.cookie.indexOf( " ", x ) + 1;
        if ( x == 0 )
            break;
    }
    return "";
}
function setCookie(name, value, expiredays){
	var todayDate = new Date();
	todayDate.setDate(todayDate.getDate() + parseInt(expiredays));
	//todayDate.setTime(todayDate.getTime() + (expiredays * 24 * 60 * 60 * 1000) );
	document.cookie = name + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";"
}
function isNum(str) {
	var cnt = 0;
	for(var i = 0; i < str.length; i++) {
    	if(isNaN(str.charAt(i))){
			if( str.charAt(i) == ".") {
				if(cnt == 1) return false;
				cnt = 1;	
			}else {
        		return false;
			}
		}
    }
	return true;
}
function WindowCheck() {
	g_fIsSP2 = (window.navigator.userAgent.indexOf("SV1") != -1);
	if (g_fIsSP2) return 20; 
	else return 0;
}
function leapYear(year) { 
	if (year % 4 == 0) return true ;
	else return false ;
}

function dCheck(val){
	YMD = DateCheck(val,"-");
	if (YMD != false) return;
	return false;
}
function dCheck2(val){
	YMD = DateCheck3(val);
	if (YMD != false) return true;
	return false;
}
function dCheck3(Obj){
	YMD = DateCheck(Obj.value,"-");
	if (YMD != false) return;
	Obj.value = "";
	Obj.focus();
	return false;
}
function DateCheck(val,sepa){
	if (sepa == "") sepa = ".";
	var anum=/(^\d+$)|(^\d+\.\d+$)/
	len = val.length;
	year = month = day = "";
	if (len != 0){
		point1 = val.substring(4,5) ;
		point2 = val.substring(7,8) ;
		year = val.substring(0,4) ;
		month = val.substring(5,7) ;
		day = val.substring(8,10) ;
		if (len != 10) check = 'NO';
		else if ( point1 != sepa || point2 != sepa ) check ='NO';
		else if (anum.test(year) == false || anum.test(month) == false || anum.test(day) == false) check = 'NO';
		else if (month < 1 || month > 12) check = 'NO';
		else if (day < 1 || day > 31) check = 'NO';
		else check = 'YES';
		if (check == "NO"){
			alert("날자 규격이 맞지 않습니다.\n\n입력방식은 'YYYY"+sepa+"MM"+sepa+"DD' 입니다.");
			return false;
		}
	} else {
		return true;
	}
	return year+month+day;
}
function DateCheck2(val){
	var anum=/(^\d+$)|(^\d+\.\d+$)/
	len = val.length;
	year = month = day = "";
	if (len != 0){
		year = val.substring(0,4) ;
		month = val.substring(4,6) ;
		day = val.substring(6,8) ;
		if (len != 8) check = 'NO';
		else if (anum.test(year) == false || anum.test(month) == false || anum.test(day) == false) check = 'NO';
		else if (month > 12 && day > 31) check = "NO";
		else check = 'YES';
		if (check == "NO"){
			alert("날자 규격이 맞이 않습니다.\n\n입력방식은 'YYYYMMDD' 입니다.");
			return false;
		}
	} else {
		return true;
	}
	return year+month+day;
}
function DateCheck3(val){
	var anum=/(^\d+$)|(^\d+\.\d+$)/
	len = val.length;
	year = month = day = "";
	if (len != 0){
		val = val.toUpperCase();
		year = val.substring(5,7) ;
		month = val.substring(2,5) ;
		day = val.substring(0,2) ;
		if (len != 7) check = 'NO';
		else if (anum.test(year) == false || checkMonth(month) == false || anum.test(day) == false) check = 'NO';
		//else if (day > 31) check = "NO";
		else if (getDays(Number(checkMonth(month)), year) < Number(day)) check = "NO";
		else check = 'YES';
		if (check == "NO"){
			alert("날자 규격이 맞이 않습니다.\n\n입력방식은 '05SEP88' (일,월,년) 으로 입력 바랍니다.");
			return false;
		} else {
			return true;
		}
	} else {
		return true;
	}
	return false;
}
function DateCheck4(val){
	var anum=/(^\d+$)|(^\d+\.\d+$)/
	len = val.length;
	year = month = day = "";
	if (len != 0){
		year = val.substring(0,2) ;
		month = val.substring(2,4) ;
		day = val.substring(4,6) ;
		if (len != 6) check = 'NO';
		else if (anum.test(year) == false || anum.test(month) == false || anum.test(day) == false) check = 'NO';
		else if (month > 12 && day > 31) check = "NO";
		else check = 'YES';
		if (check == "NO"){
			alert("날자 규격이 맞이 않습니다.\n\n입력방식은 'YYMMDD' 입니다.");
			return false;
		}
	} else {
		return true;
	}
	return true;
}
function DateAutoCheck(Obj) {
	str = StrClear(Obj.value);
	year = str.substring(0,4);
	month = str.substring(4,6);
	day = str.substring(6,8);
	str = year ;
	if (month != "") str += "-" + month;
	if (day != "") str += "-" + day;
	Obj.value = str;
	return false;
}

function ConvertDayMonth2(str) {
	//str   = StrClear(str);
	day   = str.substring(0,2);
	month = checkMonth(str.substring(2,5));
	year  = str.substring(5,7);
	return "20"+year+month+day;
}

function checkMonth(month) { 
	month = month.toUpperCase();
	var ar = new Array(12) ;
	ar["JAN"] = "01"
	ar["FEB"] = "02"
	ar["MAR"] = "03"
	ar["APR"] = "04"
	ar["MAY"] = "05"
	ar["JUN"] = "06"
	ar["JUL"] = "07"
	ar["AUG"] = "08"
	ar["SEP"] = "09"
	ar["OCT"] = "10"
	ar["NOV"] = "11"
	ar["DEC"] = "12"
	if (ar[month]) return ar[month];
	else return false;
}

// 월변환
function checkMonth2(month) { 
	var ar = new Array(12) 
	ar["01"] = "JAN";
	ar["02"] = "FEB";
	ar["03"] = "MAR";
	ar["04"] = "APR";
	ar["05"] = "MAY";
	ar["06"] = "JUN";
	ar["07"] = "JUL";
	ar["08"] = "AUG";
	ar["09"] = "SEP";
	ar["10"] = "OCT";
	ar["11"] = "NOV";
	ar["12"] = "DEC";
	return ar[month];
}

function getDays(month, year) { 
	month = month * 1;
	var ar = new Array(12) 
	ar[1] = 31 
	ar[2] = (leapYear(year)) ? 29 : 28 
	ar[3] = 31 
	ar[4] = 30 
	ar[5] = 31 
	ar[6] = 30 
	ar[7] = 31 
	ar[8] = 31 
	ar[9] = 30 
	ar[10] = 31 
	ar[11] = 30 
	ar[12] = 31 
	
	return ar[month] 
}
function getMonthName(month) { 
	var ar = new Array(12) 
	ar[1] = "1월" 
	ar[2] = "2월" 
	ar[3] = "3월" 
	ar[4] = "4월" 
	ar[5] = "5월" 
	ar[6] = "6월" 
	ar[7] = "7월" 
	ar[8] = "8월" 
	ar[9] = "9월" 
	ar[10] = "10월" 
	ar[11] = "11월" 
	ar[12] = "12월" 
	
	return ar[month] 
} 
function getWeek(week) {
	var ar = new Array() 
	ar[0] = "일"; 
	ar[1] = "월";
	ar[2] = "화"; 
	ar[3] = "수";
	ar[4] = "목";
	ar[5] = "금";
	ar[6] = "토";
	return ar[week];
}
function cala_weekday( x_nMonth, x_nDay, x_nYear) {
	if(x_nMonth >= 3){        
		x_nMonth -= 2;
	} else {
		x_nMonth += 10;
	}
	
	if( (x_nMonth == 11) || (x_nMonth == 12) ){
		x_nYear--;
	}
	
	var nCentNum = parseInt(x_nYear / 100);
	var nDYearNum = x_nYear % 100;
	
	var g = parseInt(2.6 * x_nMonth - .2);
	
	g += parseInt(x_nDay + nDYearNum);
	g += nDYearNum / 4;        
	g = parseInt(g);
	g += parseInt(nCentNum / 4);
	g -= parseInt(2 * nCentNum);
	g %= 7;
	
	if(g < 0){
		g += 7;
    }
    
    return g;
}
function semiLogin() {
	alert('먼저 로그인을 하여 주시기 바랍니다');
	sFile = "../member/login2.php";
	OpenWindow(sFile,"",0,550,150,100,100);
	return false;
}
function Round(num, po){
	return num.toFixed(po);
	/*
	if(po == 1){
		return Math.round(num);
	} else {
		var strNum = String(num);
		var num1 = strNum.split(".")[0];
		var num2 = strNum.split(".")[1];
		var i = strNum.indexOf(".");
		if(po > num2.length){
			return num;
		} else {
			var tmpNum = String(Math.round(num1+num2.substring(0,po-1)+"."+num2.substring(po-1)));
			return num1+"."+tmpNum.substring(i);
		}
	}
	*/
}
function RoundUp(num, po){
	if (num < 0) {
		sStatus = "-"; 
		num = num * -1;
	} else {
		sStatus = "";
	}
	str = String(num);
	len = str.length;
	returnValue = 1;
	for (ix = 0 ; ix < po ; ix ++ ) returnValue *= 10;
	if (len < po) {
		if (num > 0) num = returnValue;
	} else {
		val1 = str.substring(0,len - po);
		val2 = str.substring(len - po,len);
		if (val2 > 0) {
			val2 = returnValue;
			num = (val1 * returnValue) + val2;
		}
	}
	num = (sStatus + num)*1;
	return num;
}
function RoundDown(num, po){
	returnValue = 1;
	for (ix = 1 ; ix < po ; ix ++ ) returnValue *= 10;
	num = parseInt(num / returnValue ) * returnValue;
	return num;
}
function NumClear(str){
	if (str != "") {
		num = str.length;
		nStr = "";
		for (i = 0 ; i < num ; i ++){
			CHECK = str.charAt(i);
			if(isNum(CHECK) == false) nStr += CHECK;
			/*
			$CHECK = substr(str,ix,1);
			if (ord($CHECK) > 47 and ord($CHECK) < 58) {
				$nStr .= $CHECK;
			}
			*/
		}
	} else {
		nStr = "";
	}
	return nStr;
}
function StrClear(str){
	if (str != "") {
		num = str.length;
		nStr = "";
		for (i = 0 ; i < num ; i ++){
			CHECK = str.charAt(i);
			if(isNum(CHECK)) nStr += CHECK;
			/*
			$CHECK = substr(str,ix,1);
			if (ord($CHECK) > 47 and ord($CHECK) < 58) {
				$nStr .= $CHECK;
			}
			*/
		}
	} else {
		nStr = "";
	}
	return nStr;
}
function StrClear2(str){
	num = str.length;
	nStr = "";
	for (i = 0 ; i < num ; i ++){
		CHECK = str.charAt(i);
		if(isNum(CHECK) || CHECK == "-" || CHECK == ".") nStr += CHECK;
		/*
		$CHECK = substr(str,ix,1);
		if (ord($CHECK) > 47 and ord($CHECK) < 58) {
			$nStr .= $CHECK;
		}
		*/
	}
	return nStr;
}
function StrClear3(str){
	num = str.length;
	nStr = "";
	for (i = 0 ; i < num ; i ++) {
		CHECK = str.charAt(i);
		if(isNum(CHECK) || CHECK == "-" || CHECK == ".") nStr += CHECK;
		else break;
	}
	return nStr;
}
function commaAuto(fname,name,val) {
	if (val !="") {
		val2 = commaSplit(Del_Comma(val));
		eval("document."+fname+"."+name).value = val2;
	}
}
function commaSplit(srcNumber) {
	srcNumber = srcNumber * 1;
	var txtNumber = '' + srcNumber;
	if (isNaN(txtNumber) || txtNumber == "") {
		alert("숫자만 입력 하세요");
		//fieldName.select();
		//fieldName.focus();
	} else {
		
		var rxSplit = new RegExp('([0-9])([0-9][0-9][0-9][,.])');
		var arrNumber = txtNumber.split('.');
		arrNumber[0] += '.';
		do {
			arrNumber[0] = arrNumber[0].replace(rxSplit, '$1,$2');
		} 
		while (rxSplit.test(arrNumber[0]));
		if (arrNumber.length > 1) {
			return arrNumber.join('');
		} else {
			return arrNumber[0].split('.')[0];
		}
	}
}
function doModals(sFile,s,x,y,t,l){
	con = "status=no; help=no; dialogWidth="+x+"px;dialogHeight="+y+"px;scroll="+s+";dialogTop="+t+"px;dialogLeft="+l;
	Rc = window.showModalDialog(sFile,'',con);
	if (Rc) {
		return Rc;
	}
}
function CookieCheck() {
	document.cookie = "BrowserMemorry=ok;"
	document.cookie = "BrowserFile=ok; expires="
						+ new Date((new Date()).getTime() + 1000*60*2).toGMTString()
						+ ";"
	var testCookie = document.cookie;
	var nMem	= testCookie.indexOf("BrowserMemorry=ok");
	var nFile	= testCookie.indexOf("BrowserFile=ok");
	
	if ( nMem == -1 || nFile == -1) {
			var sDefCookieError = "\n\n('도구-인터넷옵션-보안'에서 '기본수준'을 선택해 주세요.)";
		if ( nMem == -1 && nFile == -1 ) {
			alert("[세션 단위 쿠키]와 [컴퓨터에 저장 쿠키]를 사용할 수 있도록 브라우져 설정을 해 주세요."
			+ sDefCookieError);
		} else if  ( nMem == -1 ) {
			alert("[세션 단위 쿠키]를 사용할 수 있도록 브라우져 설정을 해 주세요."
			+ sDefCookieError);
		} else if ( nFile == -1 ) {
			alert("[컴퓨터에 저장 쿠키]를 사용할 수 있도록 브라우져 설정을 해 주세요."
			+ sDefCookieError);
		}
		return false;
	}
	return true;
}


function hideMenu() {
	menuOn = false;
	document.all.hiddenMenu.style.visibility = "hidden";
}
function StrLimit(FormName,val,limit,Next) { // Obj,스트링 밸류 , 제한 길이 , 다음 element
	if (val.length >= limit) {
		if (eval("document."+FormName+"."+Next)) eval("document."+FormName+"."+Next).focus();
		//eval(Obj+.Next).focus();
	}
}

// 이미지 업로드 부분 
function mngImage() {
	//sFile = "http://imgmanager.ntour.co.kr/ftp/file.php";
	sFile = "../img_manager/manager.php?widthSize=1000";
	Rc = CenterPositionSelf(1000,700);
	OpenWindow(sFile,"",1,1000,700,Rc[0],Rc[1]);
}

// 문서중에 html code 삭제
function clearHTML(str) {
	str = unescape(str);
	//while (str.indexOf("&lt;") != -1){
		str = str.replace(/&lt;/g,"<");
	//}
	//while (str.indexOf("&gt;") != -1){
		str = str.replace(/&gt;/g,">");
	//}
	//while (str.indexOf("<P>") != -1){
		str = str.replace(/<P>/g,"\r\n");
	//}
	//while (str.indexOf("<BR>") != -1){
		str = str.replace(/<BR>/g,"\r\n");
	//}

	len = str.length;
	var ST = "60";
	var EN = "62";
	var val = "";
	var get = "Y";

	for (i = 0 ; i < len ; i ++) {
		code = str.charCodeAt(i);
		if(code == ST) get = "N";
		if(code == EN) get = "Y";
		
		if(code > "127") cut = 2;
		else cut = 1;
		if (get == "Y" && code != EN) val += str.substring(i,i+cut);
		if (cut == 2) i ++;
	}
	return val;
}
function lenCheck(str) { // 글자의 길이를 체크 // 한글 2 영문 1 한글 12px 일때 1:1 사이즈임
	Count = new Array();
	Count[0] = 0;
	Count[1] = 0;
	for (i = 0 ; i < str.length ; i ++) {
		code = str.charCodeAt(i);
		if(code > 127) Count[0] ++;
		else Count[1] ++;
	}
	return Count;
}
function rewReq(cust_no) { // 가상계좌 입금 요청용
	if (cust_no != "") sFile = "../visual/new_request.php?cust_no="+cust_no;
	else sFile = "../visual/new_request.php";
	OpenWindow(sFile,"",1,400,350,50,50);
	return false;
}
function nowTime(){
	dt=new Date()
	sec=dt.getSeconds()
	hr=dt.getHours()
	ampm="A.M."
	min=dt.getMinutes()
	return hr+"/"+min+"/"+sec;
}

function RollOverChange(s,id,name,ext) {
	var inc = 1;
	if (document.getElementById) {
		while (document.getElementById(id+inc)){
			img1 = name + inc + "_ON."+ext;
			img2 = name + inc + "_OFF."+ext;
			if (inc == s) document.getElementById(id+inc).src = img1;
			else document.getElementById(id+inc).src = img2;
			inc++;
		}
	}
	return false;
}

function CenterPosition() {
	bVer = browserCheck();
	if (bVer == "MSIE7" || bVer == "MSIE6") dc = 0; else dc = 40;
	width = (window.screen.width - document.body.clientWidth) / 2;
	height = (window.screen.height - document.body.clientHeight) / 2 - dc;
	window.moveTo(width,height);
}
function CenterPositionSelf(width,height) {
	var Rc = new Array();
	bVer = browserCheck();
	if (bVer == "MSIE7" || bVer == "MSIE6") dc = 0; else dc = 40;
	if (bVer == "MSIE6") {
		Rc[1] = (document.body.clientWidth - width) / 2;
		Rc[0] = (window.screen.availHeight - height) / 2 - dc;
	} else {
		Rc[1] = (window.screen.width - width) / 2;
		Rc[0] = (window.screen.height - height) / 2 - dc;
	}
	Rc[0] = Rc[0] + document.body.scrollTop;
	return Rc;
}
function CenterPositionSelf2(width,height) {
	var Rc = new Array();
	bVer = browserCheck();
	if (bVer == "MSIE7" || bVer == "MSIE6") dc = 0; else dc = 40;
	if (bVer == "MSIE6") {
		Rc[1] = (document.body.clientWidth - width) / 2;
		Rc[0] = (window.screen.availHeight - height) / 2 - dc;
	} else {
		Rc[1] = (document.body.clientWidth - width) / 2;
		Rc[0] = (document.body.clientHeight - height) / 2 - dc;
	}
	Rc[0] = Rc[0] + document.body.scrollTop;
	return Rc;
}

function CenterPositionSelf3(width,height) {
	var Rc = new Array();
	bVer = browserCheck();
	if (bVer == "MSIE7" || bVer == "MSIE6") dc = 0; else dc = 40;
	if (bVer == "MSIE6") {
		Rc[1] = (parent.document.body.clientWidth - width) / 2;
		Rc[0] = (parent.window.screen.availHeight - height) / 2 - dc;
	} else {
		Rc[1] = (parent.document.body.clientWidth - width) / 2;
		Rc[0] = (parent.document.body.clientHeight - height) / 2 - dc;
	}
	Rc[0] = Rc[0] + document.body.scrollTop;
	return Rc;
}

// 페이지 관련 스크립트
function ModeChangeT(fData1,val1,fData2,val2){
	eval("document.frmSearchPop."+fData1).value = val1;
	eval("document.frmSearchPop."+fData2).value = val2;
	document.frmSearchPop.submit();
}

// 페이지 관련 스크립트
function ModeChange(fData,val){
	eval("document.CurrentData."+fData).value = val;
	ModeAction();
}
function ModeChange2(fData,val){
	eval("document.CurrentData."+fData).value = val;
}
function ModeChange3(fData1,val1,fData2,val2){
	ModeChange2(fData1,val1);
	ModeChange2(fData2,val2);
	ModeAction();
}
function ModeChange4(arrow){
	if (arrow != "B") {
		if (document.CurrentData.Arrow.value == "1") {
			document.CurrentData.Arrow.value = "2";
		} else {
			document.CurrentData.Arrow.value = "1";
		}
	} else {
		document.CurrentData.Arrow.value = "1";
	}
	document.CurrentData.Sorting.value = arrow;
	ModeAction();
}
function ModeChange5(semi_data) {
	ModeChange2("sWord",semi_data);
	ModeChange2("direct_page","1");
	ModeChange2("page","1");
	ModeAction();
	return false;
}
function ModeChange6(val) {
	ModeChange2("listCount",val);
	ModeChange2("direct_page","1");
	ModeChange2("page","1");
	ModeAction();
	return false;
}
function ModeChange7(val){
	ModeChange2("GU2",val);
	ModeAction();
	return false;
}
function ModeChange8(val){
	if (document.CurrentData.Sorting.value != val) {
		document.CurrentData.Sorting.value = val;
		document.CurrentData.Arrow.value = "down";
	} else {
		if (document.CurrentData.Arrow.value == "up") {
			document.CurrentData.Arrow.value = "down";
		} else {
			document.CurrentData.Arrow.value = "up";
		}
	}
	ModeAction();
	return false;
}

function ModeChange9(){
	Obj = document.frmSearch;
	if (Obj.viewMode.checked == true) {
		document.CurrentData.vMode.value = "Y";
	} else {
		document.CurrentData.vMode.value = "N";
	}
	ModeAction();
	//return false;
}
function ModeChange10(val){
	ModeChange2("vMode",val);
	ModeChange2("page","1");
	ModeAction();
	return false;
}
function ModeChange11(){
	if(frmForm.cancel.checked == true) {
		document.CurrentData.cancel.value = "Y"; 
	} else {
		document.CurrentData.cancel.value = "";
	}
	ModeAction();
}
function ModeChange12(){
	if(frmSearch.cancel.checked == true) {
		document.CurrentData.cancel.value = "Y"; 
	} else {
		document.CurrentData.cancel.value = "";
	}
	document.CurrentData.page.value = "1";
	ModeAction();
}


// 액션 부분
function ModeAction(){
	LoadingStart () 
	document.CurrentData.target = "_self";
	if (document.CurrentData.SELF_URL) document.CurrentData.action = document.CurrentData.SELF_URL.value;
	document.CurrentData.submit();
}

// this function is already called in main.html, if not works, uncomment this code. Otherwise, no need to uncomment.
// function seatViews() {		
	
// 		$(".seat-layer").show();
// 		$(".city-layer").hide();
// 		$(".calendar-layer").hide();
	
// 	}

function SemiSearch() {
	LoadingStart ();
	if(document.frmSearch.page) document.frmSearch.page.value = 1;
	document.frmSearch.submit();
	return false;
}

function LoadingStart (gubun) {
	if (gubun != "self" && parent.document.getElementById("HiddenSwf")) Obj = parent.document.getElementById("HiddenSwf");
	else Obj = document.getElementById("HiddenSwf");
	Obj.style.display = "";
	Obj.innerHTML = "<img src='../swf/loading.gif'>";
}

function LoadingStop (gubun) {
	if (gubun != "self" && parent.document.getElementById("HiddenSwf")) Obj = parent.document.getElementById("HiddenSwf");
	else Obj = document.getElementById("HiddenSwf");
	Obj.style.display = "none";
}

// 백그라운드 작업용 스크립트
function setHttp(sFile,mode,mode2) { 
	if (window.XMLHttpRequest) { 
		xmlhttp = new XMLHttpRequest(); 
	} else { 
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); 
	}
	xmlhttp.open('get',sFile,true); 
	DATA = new Array();
	xmlhttp.onreadystatechange = function(){ 
		if(xmlhttp.readyState == '4') {
			if(xmlhttp.status == 200) { 
				//eval(xmlhttp.responseText);
				//alert(xmlhttp.responseText);
				if (mode == "refresh") {
					document.location.reload();
				} else if (mode == "parent.refresh") {
					parent.document.location.reload();
				} else if (mode == "opener.refresh") {
					opener.document.location.reload();
					window.close();
				} else if (mode == "airCodeCheck") {
					eval(xmlhttp.responseText);
					CheckConfirm(DATA);
				} else if (mode == "cityCodeCheck") {
					eval(xmlhttp.responseText);
					cityCheckConfirm(DATA);
				} else if (mode == "PDC_CHECK") { // 블럭 주문에서 현재 가능 인원 확인하는 루틴
					eval(xmlhttp.responseText);
					pdcCheck2(DATA);
				} else if (mode == "airSearch") {
					eval(xmlhttp.responseText);
					searchView("departure");
				} else if (mode == "InterSearch") {
					eval(xmlhttp.responseText);
					interlineSearchView();
				} else if (mode == "webTerminal") {
					//alert(xmlhttp.responseText);
					eval(xmlhttp.responseText);
					resAction(mode2,DATA);
				} else if (mode == "SUM") {
					return eval(xmlhttp.responseText);
				}
			}
		}
	} 
	xmlhttp.send(null); 
	//return true;
}

// 클래스 교체 스크립트
function classChange(s,idname,classOnName,classOffName){
	inc = 0;
	if (document.getElementById) {
		while (document.getElementById(idname + inc)) {
			if (s == inc) cName = classOnName;
			else cName = classOffName;
			document.getElementById(idname + inc).className = cName;
			inc ++;
		}
	}
}

// 테이블을 보이고 안보이고 하는 부분
function TableChange(s,name) { 
	var inc = 0;
	if (document.getElementById) {
		while (document.getElementById(name+inc)){
			if (inc == s) document.getElementById(name+inc).style.display = "";
			else document.getElementById(name+inc).style.display = "none";
			inc++
		}
	}
}
// 탭 메뉴 조절 부분
function TableChangeSub(s,name) {
	var inc = 0;
	if (document.getElementById) {
		while (document.getElementById(name+"1_"+inc)){
			if (inc == s) {
				document.getElementById(name+"1_"+inc).style.display = "";
				document.getElementById(name+"2_"+inc).style.display = "none";
			} else {
				document.getElementById(name+"1_"+inc).style.display = "none";
				document.getElementById(name+"2_"+inc).style.display = "";
			}
			inc++
		}
	}
}

// 글자수 체크
function Field_check(str,max){
	len = str_len(str);
	if (len > max) {
		str = cut_str(str, max);
		frmDat.content.value = str;
		len = max;
	}
	frmDat.text_length.value = len;
	return false;
}

function str_len(str) {
	var len=0, j;
	for (i=0, j=str.length; i<j; i++, len++) {
		if ( (str.charCodeAt(i)<0)||(str.charCodeAt(i)>127) ) {
			len = len+1;
		}
	}
	return len;
}
function CutDate(str) {
	str = StrClear(str);
	return str.substring(0,4)+"-"+str.substring(4,6)+"-"+str.substring(6,8);
}
function CutTime(str) {
	str = StrClear(str);
	return str.substring(0,2)+":"+str.substring(2,4);
}
function cut_str(str, max) {
	var tmpStr;
	var temp=0;
	var onechar;
	var tcount;
	tcount = 0;
	tmpStr = new String(str);
	temp = tmpStr.length;

	alert(max  + " 글자 까지만 입력이 가능합니다.");
	
	for(k=0;k<temp;k++)	{
		onechar = tmpStr.charAt(k);
		
		if(escape(onechar).length > 4) {
			tcount += 2;
		} else if(onechar!='\r') {
			tcount++;
		}
		if(tcount>max) {
			tmpStr = tmpStr.substring(0, k);     
			break;
		}
	}
	return tmpStr;
}
function settleAction(uid,id,num) {
	sFile = "../bill/settle_passwd.php";
	width = (window.screen.width - 200) / 2 ;
	height = (window.screen.height - 150) / 2;	
	var Rc = doModals(sFile,0,200,150,height,width);
	if (Rc) {
		sFile = "../bill/settle_check.php?mode=settle&uid="+uid+"&id="+id+"&num="+num+"&passwd="+Rc;
		frames['HIDE_ACTION'].location.href = sFile;
	}
	return false;	
}


function printWindowStart(){
	if (Installed()) {
		IEPageSetupX.Orientation = 1;
		IEPageSetupX.header = "";
		IEPageSetupX.footer = "";
		IEPageSetupX.leftMargin = 0.0;
		IEPageSetupX.rightMargin = 0.0;
		IEPageSetupX.topMargin = 5.0;
		IEPageSetupX.bottomMargin = 5.0;
		IEPageSetupX.PrintBackground = true;
		IEPageSetupX.ShrinkToFit = false;
		IEPageSetupX.PaperSize = 'A4';
		IEPageSetupX.Print();
		//IEPageSetupX.Preview();
		alert('기본 프린터로 출력 완료');
	} else {
		alert("컨트롤을 설치하지 않았네요.. 정상적으로 인쇄되지 않을 수 있습니다.");
	}
}
function printWindow(){
	window.self.focus();
	setTimeout("printWindowStart()",500);
}

/*
function printWindow(){
	IEPrint.left = IEPrintStatus["left"];
	IEPrint.right = IEPrintStatus["right"];
	IEPrint.top = IEPrintStatus["top"];
	IEPrint.bottom = IEPrintStatus["bottom"];
	IEPrint.header = IEPrintStatus["header"];
	IEPrint.footer = IEPrintStatus["footer"];
	IEPrint.printbg = IEPrintStatus["printbg"];  // 이전버전과 달리 true, false로 설정한다.
	IEPrint.landscape = IEPrintStatus["landscape"]; // 가로 출력을 원하시면 true로 넣으면 됩니다. 세로출력은 false입니다.
	IEPrint.paper = IEPrintStatus["paper"];  // 용지설정입니다.
	//IEPrint.Print();   // 위에 설정한 값을 실제 적용하고, 프린트다이얼로그를 띄웁니다.
	IEPrint.SilentPrint();
	alert('기본 프린터로 출력 완료');
}
*/

function printWindowSelStart() {
	if (Installed()) {
		IEPageSetupX.Orientation = 1;
		IEPageSetupX.header = "";
		IEPageSetupX.footer = "";
		IEPageSetupX.leftMargin = 0.0;
		IEPageSetupX.rightMargin = 0.0;
		IEPageSetupX.topMargin = 5.0;
		IEPageSetupX.bottomMargin = 5.0;
		IEPageSetupX.PrintBackground = true;
		IEPageSetupX.ShrinkToFit = false;
		IEPageSetupX.PaperSize = "A4";
		IEPageSetupX.Print(true);
		//IEPageSetupX.Preview();
	} else {
		alert("컨트롤을 설치하지 않았네요.. 정상적으로 인쇄되지 않을 수 있습니다.");
	}
}
function printWindowSel(){
	window.self.focus();
	//IEPageSetupX.Print();
	setTimeout("printWindowSelStart()",500);
}

/*
function printWindowSel(){
	IEPrint.left = IEPrintStatus["left"];
	IEPrint.right = IEPrintStatus["right"];
	IEPrint.top = IEPrintStatus["top"];
	IEPrint.bottom = IEPrintStatus["bottom"];
	IEPrint.header = IEPrintStatus["header"];
	IEPrint.footer = IEPrintStatus["footer"];
	IEPrint.printbg = IEPrintStatus["printbg"];  // 이전버전과 달리 true, false로 설정한다.
	IEPrint.landscape = IEPrintStatus["landscape"]; // 가로 출력을 원하시면 true로 넣으면 됩니다. 세로출력은 false입니다.
	IEPrint.paper = IEPrintStatus["paper"];  // 용지설정입니다.
	//IEPrint.Print();   // 위에 설정한 값을 실제 적용하고, 프린트다이얼로그를 띄웁니다.
	IEPrint.Print();
}
*/

function printWindowLandSelStart(){
	if (Installed()) {
		IEPageSetupX.Orientation = 0;
		IEPageSetupX.header = "";
		IEPageSetupX.footer = "";
		IEPageSetupX.leftMargin = 0.0;
		IEPageSetupX.rightMargin = 0.0;
		IEPageSetupX.topMargin = 0.0;
		IEPageSetupX.bottomMargin = 0.0;
		IEPageSetupX.PrintBackground = true;
		IEPageSetupX.ShrinkToFit = false;
		IEPageSetupX.PaperSize = 'A4';
		IEPageSetupX.Print(true);
		//IEPageSetupX.Preview();
	} else {
		alert("컨트롤을 설치하지 않았네요.. 정상적으로 인쇄되지 않을 수 있습니다.");
	}
}
function printWindowLandSel(){
	window.self.focus();
	setTimeout("printWindowLandSelStart()",500);
}

function printWindowLand(){
	window.self.focus();
	setTimeout("printWindowLandSelStart()",500);
}
/*
function printWindowLand(){
	IEPrint.left = IEPrintStatus["left"];
	IEPrint.right = IEPrintStatus["right"];
	IEPrint.top = IEPrintStatus["top"];
	IEPrint.bottom = IEPrintStatus["bottom"];
	IEPrint.header = IEPrintStatus["header"];
	IEPrint.footer = IEPrintStatus["footer"];
	IEPrint.printbg = IEPrintStatus["printbg"];  // 이전버전과 달리 true, false로 설정한다.
	IEPrint.landscape = "true"; // 가로 출력을 원하시면 true로 넣으면 됩니다. 세로출력은 false입니다.
	IEPrint.paper = IEPrintStatus["paper"];  // 용지설정입니다.
	IEPrint.Print();   // 위에 설정한 값을 실제 적용하고, 프린트다이얼로그를 띄웁니다.
	//IEPrint.SilentPrint();
}
*/
// 테스트 박스 라인 줄수 늘리기
function lineCheck(Obj) {
	Obj.style.height = Obj.scrollHeight + "px";
}
function boxCheck(pos) {
	for (ix = 0 ; ix < 5 ; ix ++) {
		if (eval("document.forms["+ix+"]."+pos)) {
			Obj = eval("document.forms["+ix+"]."+pos);
			break;
		}
	}
	h = Obj.scrollHeight;
	if (h < 18) h = 18;
	Obj.style.height = h + "px";
	return false;
}

document.onkeydown = checkKeycode
function checkKeycode(e) {
	var keycode;
	if (window.event) keycode = window.event.keyCode;
	else if (e) keycode = e.which;
	if ( keycode == "27") {
		url = top.document.location.href;
		if ( url.indexOf("main/main.html") == -1 && url.indexOf("main/new_main.html") == -1) {
			//2023-11-06 esc 창닫힘 기능 삭제요청
			// 2024-01-17 나만 복구
			if (oye_login_id == "CHANGYS8") top.window.close();
		}  
	}
}

function pnrCheckClear () {
	if (document.all.HiddenSwf) document.all.HiddenSwf.style.display = "none";
}
function MainPageDrop() {
	DocumentWidth = document.body.scrollWidth;
	DocumentHeight = document.body.scrollHeight
	
	document.all.HiddenLayer.style.width = DocumentWidth + "px";
	document.all.HiddenLayer.style.height = DocumentHeight + "px";
	document.all.HiddenLayer.style.display = "";
	
	document.images.HiddenImage.width = DocumentWidth + "px";
	document.images.HiddenImage.height = DocumentHeight + "px";
}
function MainPageUp() {
	document.all.HiddenLayer.style.width = 0;
	document.all.HiddenLayer.style.height = 0;
	document.all.HiddenLayer.style.display = "none";
	
	document.images.HiddenImage.width = 0;
	document.images.HiddenImage.height = 0;
}
function DetailDrop(Pos) {
	if (!Pos) Pos = "HiddenQnaLayer";
	if (Pos == "HiddenQnaLayer") MainPageUp();
	eval("document.all."+Pos).style.display = "none";
	eval("document.all."+Pos).style.width = 0;
	eval("document.all."+Pos).style.height = 0;
	revTimeCheckClear();
	return false;
}

function cityCheckMoreChange(city,HostName) {
	if (document.getElementById("cityCheckMore"+city).style.display == "") {
		document.getElementById("cityCheckMore"+city).style.display = "none";
		eval("document.images.cityCheckImg"+city).src = HostName + "/images/air/btn_search_city_02_off.gif";
	} else {
		document.getElementById("cityCheckMore"+city).style.display = "";
		eval("document.images.cityCheckImg"+city).src = HostName + "/images/air/btn_search_city_02_on.gif";
	}
	return false;
}

function HP_sawp_image (imgName,img) {
	document.images[imgName].src = img;
}

function getInternetVersion(ver) { 
	var rv = -1;
	var ua = navigator.userAgent;  
	var re = null;
	if(ver == "MSIE"){
		re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
	}else{
		re = new RegExp(ver+"/([0-9]{1,}[\.0-9]{0,})");
	}
		if (re.exec(ua) != null){ 
		rv = parseFloat(RegExp.$1);
	} 
	return rv;  
}

function browserCheck(){ 
	var ver = 0;
	rt = "";
	if(navigator.appName.charAt(0) == "N"){ 
		if(navigator.userAgent.indexOf("Chrome") != -1) {
			ver = getInternetVersion("Chrome");
			//alert("Chrome"+ver+"입니다"); 
			rt = "Chrome"+ver;
		} else if(navigator.userAgent.indexOf("Firefox") != -1){
			ver = getInternetVersion("Firefox");
			//alert("Firefox"+ver+"입니다");
			rt = "Firefox"+ver;
		} else if(navigator.userAgent.indexOf("Safari") != -1){
			ver = getInternetVersion("Safari");
			//alert("Safari"+ver+"입니다");
			rt = "Safari"+ver;
		}
	} else if(navigator.appName.charAt(0) == "M"){
		ver = getInternetVersion("MSIE");
		//alert("MSIE"+ver+"입니다");
		rt = "MSIE"+ver;
	}
	return rt;
}

// 남은 시간 되돌려주기
function remainTime(str) {
	days = parseInt(str/86400);
	str2 = str%86400;
	hour = parseInt(str2/3600);
	str3 = str2%3600;
	minute = parseInt(str3/60);
	second = parseInt(str3%60);
	if (minute < 10) minute = "0" + minute;
	if (second < 10) second = "0" + second;
	if (days > 0) days += "일 ";
	else days = "";
	if (hour > 0) hour += ":"; else hour = "";
	return days + hour + minute + ":" + second;
}

// 남은 날짜 리턴     YYYYMMDD 형식으로 계산
function remainDate(st,rt) {
	s1 = st.substring(0,4);
	s2 = st.substring(4,6);
	s3 = st.substring(6,8);

	r1 = rt.substring(0,4);
	r2 = rt.substring(4,6);
	r3 = rt.substring(6,8);

	

	var today = new Date(checkMonth2(s2)+" " + s3 + " " + s1);
	var mday = new Date(checkMonth2(r2)+" " +r3 + " " + r1);
	var tmime = (mday.getTime() - today.getTime());
	var itime = 24 * 60 * 60 * 1000;
	var fdday = tmime / itime;
	var dday = Math.floor(fdday);

	return dday;
}

// 사이즈 관련 스크립트 부분
loadCheck = false;
function loadReSize() {
	bVer = browserCheck();
	if (top.document.all.HiddenSwf) {
		Obj = top.document.all.HiddenSwf;
		Obj.style.display = "none";
		if (document.getElementById("listFrame") && parent.MobileAccess == "") {
			width  = document.documentElement.clientWidth;
			height = document.documentElement.clientHeight;
			dcHeight = 27;
			if (document.getElementById("bottomFrame")) dcHeight += 39;
			//if (document.getElementById("popFrame")) dcHeight += 108;
			if (document.getElementById("popBottomFrame")) dcHeight += 48;
			if (document.getElementById("searchFrame")) dcHeight += 39;
			height = height - dcHeight;
			//if (bVer != "MSIE8" && document.getElementById("listFrameSub") == true) 
			// 무조건 전체사지으 보다 16 줄여서 만듬
			if (bVer != "MSIE8" && document.getElementById("listFrameSub") && width > 0) document.getElementById("listFrameSub").style.width = width - 16 ;
			if(height > 0 ) document.getElementById("listFrame").style.height = height+"px" ;
			if (loadCheck == false) {
				loadCheck = true;
				//setTimeout("loadReSize()",1000)
			}
		}
	}
}
//if (parent.MobileAccess == "") window.onresize=loadReSize;
//window.onload=loadReSize;
// 여기까지

// 2018-07-11 패스워드 룰 추가
function passCheck (str) {
	var passwordRules = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,16}$/;
	return passwordRules.test(str);
}

//2019-06-19 상품복사 추가
function copyProduct(tourGubun,copyTourNumber,copyPrice){
	var Rc = confirm("상품을 복사하시겠습니까? 이미지가 많을경우 시간이 오래걸릴 수 있습니다.");

	if(Rc){
		var sFile = "../order/copy.php?tourGubun="+tourGubun+"&copyTourNumber="+copyTourNumber+"&copyPrice="+copyPrice;
		frames['HIDE_ACTION'].document.location.href = sFile;
	}
	return false;
}


//배경 레이어 온 오프
function backGroundLayerOpen(){
	$(".overlay-bg").show();
}
function backGroundLayerClose(){
	$(".overlay-bg").hide();
}

// 상품 거래처 추가
function addSiteCode(triptelPartnerJoin){
	Obj = document.frmForm;
	var i = Obj.siteCodeCnt.value;
	var partnerRead = "";


	

	if(i <= 5){
		sub = "";
		if(triptelPartnerJoin == "Yes") {
			b2b_site_code = getCookie("b2b_site_code");
			b2b_site_name = getCookie("b2b_site_name");
			sub += "		<input name='site_code"+i+"' type='text'  class='form-control form-control-sm mt-2 wh100'   value='"+b2b_site_code+"' readonly>";
			sub += "		<input name='saleSite"+i+"'  type='text'  class='form-control form-control-sm mt-2 wh500'  value='"+b2b_site_name+"' readonly>";
		} else {
			sub += "		<input name='site_code"+i+"' type='text'  class='form-control form-control-sm mt-2 wh100'   value='' onChange='siteCheck(this.value,"+i+")' "+partnerRead+">";
			sub += "		<input name='saleSite"+i+"'  type='text'  class='form-control form-control-sm mt-2 wh500'  value='' readonly>";
		}

		var html = "<tr id='siteCode"+i+"'>";
		html += "		<th scope='row' class='regis-hotel-td1' style=''>업체소속"+i+"</th>";
		html += "		<td>";
		html += sub;
		html += "			<br>";
		html += "			<div style='position:relative'>";
		html += "				<div style='position:absolute;top:0;left:0' ID='SiteSearch"+i+"'></div>";
		html += "			</div>";
		html += "		</td>";
		html += "		<th scope='row'  class='regis-hotel-td1' style=''>상품구분"+i+"</th>";
		html += "		<td><select name='tourGubun"+i+"'><option value='1'>호텔</option><option value='2'>트립</option><option value='3'>항공</option><option value='4'>기타</option></select></td>";
		html += "	</tr>";

		if(i == 2) $("#siteCode").after(html);
		else $("#siteCode"+(parseInt(i) - parseInt(1))).after(html);

		Obj.siteCodeCnt.value = parseInt(Obj.siteCodeCnt.value) + parseInt(1);
	}
}


function engToKor(input) {
	const keyMap = {
	  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
	  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
	  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ'
	};
	return input
	  .split('')
	  .map(ch => keyMap[ch] || ch)
	  .join('');
}

// in_array 2021-10-26
function inArray(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}

function fnAddElement(fNm, nm, value){
	var theForm = document.forms[fNm]; 
	if ( theForm.elements[nm] == null){
		var input   = document.createElement('input'); 
		input.type   = 'hidden'; 
		input.name  = nm; 
		input.id  = nm; 
		input.value  = value; 
		theForm.appendChild(input); 
	}else{
		$("#" + nm).val(value);
	}
}