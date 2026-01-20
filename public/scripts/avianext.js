	function lanTrans (tourNumber,minor_num,table,field,target,target_field) {
		sFile = "../dida/data_change.php?mode=TRANSFIELD&tourNumber="+tourNumber+"&minor_num="+minor_num+"&table="+table+"&field="+field+"&target="+target+"&target_field="+target_field;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}
	function stockChange (sale_date,tourNumber,minor_num,stock) {
		sFile = "../lib/data_change.php?mode=Stock&sale_date="+sale_date+"&tourNumber="+tourNumber+"&minor_num="+minor_num+"&stock="+stock;
		frames["OYE_SAVE"].location.href = sFile;
	}
	function stockUpdate (idx) {
		Obj = document.frmTemp;
		if(typeof idx != 'undefined') Obj.idx.value = idx;
		minor = Obj.minor.value;
		if (minor == "") {
			alert("먼저 상품을 선택하세요!");
		} else {
			//MainPageDrop ();
			backGroundLayerOpen();
			document.all.HiddenRuleLayer.style.display = "none";
			Obj.action = "../triptel/stock_register.html";
			Obj.target = "HIDE_ACTION";
			Obj.mode   = "Basic";
			Obj.submit();
		}
		return false;
	}

	function moneyBill() {
		frameChange ('cashbill', '../cashBill/cashbill_list.html' , '현금영수증');
	}

	function tourList() {
		frameChange ('', '../rev/tour_list.html' , '투어예약') ;
	}
	function mainView () {
		frameChange ('MAIN', '../main/body' , 'Main') ;
	}
	function insurePack () {
		frameChange ('INSURE', '/insure/insure_list' , '손해보험') ;
	}

	function domesticRev () {
		frameChange ('DOMEORDER', '../domSearch/domRev' ,  "국내선예약") ;
		leftMenuHide();
	}
	function domesticList () {
		frameChange ('DOMELIST', '../air/dom_list' , "국내선예약목록") ;
	}
	
	function interlineRevV2 () {
		frameChange ('INTERORDER', '/interSearch/interRev' , "국제선예약") ;
		leftMenuHide();
	}
	function interDcRev () {
		if (LoginGroup == "Prime") frameChange ('BLOCKAIR', '../BlockPrime/air_block.html' , Lan__ ("dcairline")) ;
		else frameChange ('BLOCKAIR', '../Block/air_block.html' , Lan__ ("dcairline")) ;
		leftMenuHide();
	}
	function hotelPack () {
		frameChange ('HOTELPACK', '../hotelPack/hotel_check.html' , '리조트팩') ;
	}
	function Insure () {
		window.open("https://bit.ly/3g0Dt4H");
	}
	function groupMore () {
		frameChange ('GROUPAIR', '../Group/group_list.html' , '견적요청') ;
	}
	function curRate () {
		OpenWindowA("../initail/ex_view.html","",1,1000,800);
	}
	function tourMore (s) {
		frameChange ('travel', '../Tour/tour_list_new.html?'+s , '여행상품') ;
	}

	function roomSetDate (day,restRoom) {
		Obj       = document.frmForm;
		checkIn   = Obj.checkIn.value;
		checkOut  = Obj.checkOut.value;
		cPos      = Obj.cPos.value;
		cDate     = Obj.cDate.value;
		cMode     = Obj.cMode.value;
		LimitDate = Obj.LimitDate.value;
		if (cPos == "In" && restRoom < 1) {
			alert("빈 객실이 없습니다.");
			return false;
		} else if (cPos == "In") {
			Obj.checkIn.value	= day;
			Obj.checkOut.value	= "";
			Obj.cPos.value		= "Out";
		} else if (cPos == "Out" &&  checkIn == day) {
			Obj.checkIn.value   = "";
			Obj.checkOut.value  = "";
			//LimitDate           = "";
			Obj.cPos.value		= "In";
			cPos                = "";
		} else {
			if (checkIn > day || LimitDate < day) return false; // 2020-07-20추가 // 2020-08-04 추가
			Obj.checkOut.value	= day;
			checkOut            = day
		}
		len = calData.length;
		sel = "";
		pr  = 0;
		for (ix = 0 ; ix < len ; ix ++) {
			cls = "";
			if (calData[ix] > NOWS && cPos == "") cls = "cal_link";
			else if (calData[ix] < day && cPos == "In") cls = "cal_gray";
			else if ( (checkIn != "" && calData[ix] == checkIn) || (cPos  == "In" && calData[ix] == day) ) {
				cls = "check_start";
				if (ix + 10 < len) LimitDate = calData[ix+10];
				else LimitDate = calData[calData.length-1];
				pr += Number(calPriceData[ix]);
				Obj.LimitDate.value = LimitDate;
			} else if ( cPos == "Out" && calData[ix] > checkIn  && calData[ix] < checkOut) {
				cls = "check_stay";
				pr += Number(calPriceData[ix]);
			} else if ( calData[ix] == day && cPos == "Out") {
				cls = "check_end";
				//pr += Number(calPriceData[ix]);
				document.getElementById("TotalPrice").innerHTML = commaSplit(pr);
				Obj.totalAmount.value = pr;
			} else if ( calData[ix] > LimitDate && LimitDate != "" ) {
				cls = "cal_gray";
			} else if ( calData[ix] <= LimitDate && checkOut < calData[ix] && cPos != "") {
				cls = "cal_link";
			} else {
				cls = "cal_gray";
			}
			if (cls) document.getElementById("D_"+calData[ix]).className = cls;
		}
	}
	function golfSetDate (day,time,pr,tourGubun) {
		Obj       = document.frmForm;
		start_day = Obj.start_day.value;
		if (start_day) {
			day2 = Number(start_day) + 1;
			document.getElementById("D_"+start_day).className = "cal_link";
			document.getElementById("D_"+day2).className = "cal_link";
		}
		Obj.start_day.value	  = day;
		Obj.start_time.value  = time;
		Obj.totalAmount.value = pr;
		day2 = Number(day) + 1;
		document.getElementById("D_"+day).className = "check_start";
		if (tourGubun == "11") document.getElementById("D_"+day2).className = "check_start";
		document.getElementById("TotalPrice").innerHTML = commaSplit(pr);
		document.getElementById("setDate").innerHTML = CutDate(day);
		document.getElementById("setTime").innerHTML = CutTime(time);
	}

	function setYesGolfTime (code,crs,day,time,pr) {
		//document.getElementById("D_"+day).className = "check_start";
		Obj       = document.frmForm;
		Obj.start_day.value	  = day;
		Obj.start_time.value  = time;
		Obj.totalAmount.value = pr;
		Obj.golf_cource.value = crs;
		Obj.golf_code.value   = code;

		document.getElementById("TotalPrice").innerHTML = commaSplit(pr);
		document.getElementById("setDate").innerHTML = CutDate(day);
		document.getElementById("setTime").innerHTML = CutTime(time);
	}

	function hotelCheck (tourNumber,minor_num,meal) {
		Obj       = document.frmForm;
		Obj.tourNumber.value = tourNumber;
		Obj.Minor.value      = minor_num;
		Obj.Meal.value       = meal;
		$("#cal_popup").toggle();
		sFile = "../rev/hotel_search_cal_new.php?tourNumber="+tourNumber+"&Minor="+minor_num+"&Meal="+meal;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}
	function golfCheck (tourNumber,minor_num,meal,yesGolfCode,GU1) {
		Obj       = document.frmForm;
		Obj.tourNumber.value  = tourNumber;
		Obj.Minor.value       = minor_num;
		Obj.Meal.value        = meal;
		Obj.GU1.value         = GU1;
		Obj.yesGolfCode.value = yesGolfCode;
		$("#cal_popup").toggle();
		sFile = "../rev/golf_search_cal_new.php?tourNumber="+tourNumber+"&Minor="+minor_num+"&Meal="+meal+"&yesGolfCode="+yesGolfCode+"&GU1="+GU1;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}
	function getGolfDetail (code,date) {
		sFile = "../rev/yesGolfCheck.php?mode=detail&code="+code+"&date="+date;
		frames["HIDE_ACTION"].location.href = sFile;
	}

	function hotelAction () {
		Obj       = document.frmForm;
		checkIn   = Obj.checkIn.value;
		checkOut  = Obj.checkOut.value;
		cPos      = Obj.cPos.value;
		cDate     = Obj.cDate.value;
		cMode     = Obj.cMode.value;
		LimitDate = Obj.LimitDate.value;
		if (checkOut == "") {
			alert("원하는 날짜를 먼저 선택하세요!");
		} else {
			backGroundLayerOpen();
			Obj.action = "hotel_register.html";
			Obj.target = "HIDE_ACTION";
			Obj.submit();
		}
	}
	function golfAction () {
		Obj       = document.frmForm;
		cMode     = Obj.cMode.value;
		start_day = Obj.start_day.value;
		if (start_day == "") {
			alert("원하는 날짜를 먼저 선택하세요!");
		} else {
			backGroundLayerOpen();
			Obj.action = "golf_register.html";
			Obj.target = "HIDE_ACTION";
			Obj.submit();
		}
	}
	function layerClose() {
		document.all.HiddenQnaLayer.style.display = "none";
		backGroundLayerClose();
	}

	function roomCalendarChange (s) {
		Obj   = document.frmForm;
		Obj.cMode.value = s;
		Obj.action = "hotel_search_cal_new.php";
		Obj.target = "HIDE_ACTION";
		Obj.submit();
	}
	function golfCalendarChange (s) {
		Obj   = document.frmForm;
		Obj.cMode.value = s;
		Obj.action = "golf_search_cal_new.php";
		Obj.target = "HIDE_ACTION";
		Obj.submit();
	}
	function viewPro () {
		Obj        = document.frmForm;
		tourNumber = Obj.tourNumber.value;
		Minor      = Obj.Minor.value;
		if (tourNumber == "") {
			alert("호텔을 먼저 선택하여 주세요!");
		} else {
			sFile = "../rev/hotel_detail.php?tourNumber="+tourNumber+"&Minor="+Minor;
			frames["HIDE_ACTION"].location.href = sFile;
		}
	}
	function moreButton (HotelID,gubun,ch) {
		chStr = "";
		if(ch != "" && typeof  ch != 'undefined') chStr = ch+"_"; 
		if (gubun == "Show") {
			// loadCircle ("Loading");			
			checkIn		= frmSearch.CheckIn.value;
			checkOut	= frmSearch.CheckOut.value;
			RoomCount	= frmSearch.RoomCount.value;
			Adt			= frmSearch.Adt.value;
			Chd			= frmSearch.Chd.value;
			search = $("#"+chStr+"Detail_"+HotelID).data("search");
			

			// scroll up, animate
			offset = $("#"+chStr+"list_"+HotelID).offset();
			$('html, body').animate({ // Frame_MAIN
				scrollTop: offset.top
			}, 500);

			$("#"+chStr+"Detail_"+HotelID).show();
			if(ch != "" && typeof  ch != 'undefined') document.getElementById(chStr+"More_"+HotelID).innerHTML = "<input type='button' value='상품 숨기기' class='btn_more' onClick=\"return moreButton('"+HotelID+"','Hide','"+ch+"')\">";
			else document.getElementById(chStr+"More_"+HotelID).innerHTML = "<input type='button' value='상품 숨기기' class='btn_more' onClick=\"return moreButton('"+HotelID+"','Hide')\">";

		} else {
			$("#"+chStr+"Detail_"+HotelID).hide();
			if(ch != "" && typeof  ch != 'undefined') document.getElementById(chStr+"More_"+HotelID).innerHTML = "<input type='button' value='상품 더보기' class='btn_more' onClick=\"return moreButton('"+HotelID+"','Show','"+ch+"')\">";
			else document.getElementById(chStr+"More_"+HotelID).innerHTML = "<input type='button' value='상품 더보기' class='btn_more' onClick=\"return moreButton('"+HotelID+"','Show')\">";
		}
	}

	function moreDomHotelButton (HotelID,gubun,ch) {
		if (gubun == "Show") {
			loadCircle ("조회중입니다");
//			LoadingStart ('self');
			CheckIn		= frmSearch.CheckIn.value;
			CheckOut	= frmSearch.CheckOut.value;
			RoomCount	= frmSearch.RoomCount.value;
			Adt			= frmSearch.Adt.value;
			Chd			= frmSearch.Chd.value;
			CityCode	= frmSearch.CityCode.value;
			DistrictCode	= frmSearch.DistrictCode.value;
			cityName	= frmSearch.cityName.value;
			search = $("#Detail_"+HotelID).data("search");
			if(search == "0"){
				sFile = "../domRev/hotel_dom_price_check.php?LodgeCode="+HotelID+"&CheckIn="+CheckIn+"&CheckOut="+CheckOut+"&RoomCount="+RoomCount+"&Adt="+Adt+"&Chd="+Chd+"&CityCode="+CityCode+"&DistrictCode="+DistrictCode+"&cityName="+cityName+"&ch="+ch;
				frames["HIDE_ACTION"].location.href = sFile;
				$("#Detail_"+HotelID).data("search","1");
			}else{
				loadCircleHide();
			}
			offset = $("#list_"+HotelID).offset();
			$('html, body').animate({ // Frame_MAIN
				scrollTop: offset.top
			}, 500);
			$("#Detail_"+HotelID).show();
			document.getElementById("More_"+HotelID).innerHTML = "<input type='button' value='상품 숨기기' class='btn_more' onClick=\"return moreDomHotelButton('"+HotelID+"','Hide')\">";
			
		} else {
			$("#Detail_"+HotelID).hide();
			document.getElementById("More_"+HotelID).innerHTML = "<input type='button' value='상품 더보기' class='btn_more' onClick=\"return moreDomHotelButton('"+HotelID+"','Show')\">";
		}
	}

	let CurrentTab = "MAIN";
	function menuChange (frameName, url , buttonName, bMode) {
		if (frameName == "") frameName = "MAIN";
		//console.log(frameName+ " " +CurrentTab);
		if (CurrentTab != frameName) {
			if (!document.getElementById("Button_"+frameName)) frameName = "MAIN"; // 지정된 버튼 영역이 없을때
			$("#Button_"+CurrentTab).removeClass("active");
			$("#Frame_"+CurrentTab).fadeOut();
			$("#Frame_"+frameName).fadeIn();
			$("Frame_"+CurrentTab).removeClass("on");
			CurrentTab = frameName;
			$("#Frame_"+CurrentTab).addClass("on");
			$("#Button_"+CurrentTab).addClass("active");
		}
		if (url != "" ) {
			document.getElementById("Frame_"+frameName).src = url;
		}
		if (buttonName != "") {
			document.getElementById("Button_"+frameName).innerHTML= buttonName;
		}
		//document.getElementById("Button_"+frameName).className  = "shortCutButton on";
		const frame = window["Frame_" + frameName];
		if (frame?.frmSearch?.titleData) {
			$("#topTitleData").html(frame.frmSearch.titleData.value);
		}
	}

	function airBook() {
		sFile = "../interline/air_book.html";
		OpenWindowA(sFile,"","",1200,800);
	}
	function LanChange (lan) {
		sFile = "../lib/language.php?lan="+lan;
		frames["HIDE_ACTION"].location.href = sFile;
	}

	function mailSend(order_num,s) {
		var Rc = confirm("예약 확약을 호텔로 요청합니다.");
		if (Rc) {
			sFile = "../order/mail_req.php?order_num="+order_num;
			frames["HIDE_ACTION"].location.href = sFile;
		}
		return false;
	}
	function lmsSend(order_num,s) {
		if (s == "D") var Rc = confirm("예약 문자를 다시한번 전송합니다.");
		else var Rc = confirm("예약 문자를 전송합니다.");
		if (Rc) {
			sFile = "../order/lms_send.php?order_num="+order_num;
			frames["HIDE_ACTION"].location.href = sFile;
		}
		return false;
	}
	function lmsSendAll(g) {
		Obj = document.frmSearch;
		sFrom = Obj.sFrom.value;
		sWord = Obj.sWord.value;

		if (sFrom != "c.tourNumber" && sWord == "") {
			alert("일괄발송은 상품코드 지정후 발송이 가능합니다.");
		} else {
			if (g == "") var Rc = confirm("BMS 일괄 예약 문자를 전송합니다.");
			else if (g == "F") var Rc = confirm("검색된 주문서에 대하여 한번더 BMS 일괄 예약 문자를 전송합니다.");
			else Rc = true;
			if (Rc) {
				//sFile = "../order/lms_send_all.php";
				//frames["HIDE_ACTION"].location.href = sFile;
				Obj  = document.frmSearch;
				if (g == "F") {
					Obj.bmsForce.value = "Force";
				} else {
					Obj.bmsForce.value = "";
				}
				Obj.target = "HIDE_ACTION";
				Obj.action = "../order/lms_send_all.php";
				Obj.submit();
			}
		}
		return false;
	}

	function lmsSendDom(uid,s) {
		if (s == "D") var Rc = confirm("예약 문자를 다시한번 전송합니다.");
		else var Rc = confirm("예약 문자를 전송합니다.");
		if (Rc) {
			sFile = "../interline/lms_send.php?uid="+uid;
			frames["HIDE_ACTION"].location.href = sFile;
		}
		return false;
	}
	function lmsSendDomAll() {
		var Rc = confirm("LMS 일괄 예약 문자를 전송합니다.");
		if (Rc) {
			sFile = "../interline/lms_send_all.php";
			frames["HIDE_ACTION"].location.href = sFile;
		}
		return false;
	}

	function excelAction (target,origin,Obj) {
		//Obj = document.frmSearch;
		Obj.target = "HIDE_ACTION";
		Obj.action = target;
		//console.log(Obj);
		Obj.submit();
		Obj.target = "_self";
		Obj.action = origin;
		return false;
	}
	function pnrTrans() {
		sFile = "../interline/pnr_trans.php";
		//$("#basePopUp").show();
		//frames["HIDE_ACTION"].location.href = sFile;
		//alert(document.getElementById("basePopUp").innerHTML);
		smallPopSecShow (sFile,800,450);
	}
	function yesGolfBook (order_num,minor_num) {
		sFile = "../YesGolf/get_books.php?order_num="+order_num+"&minor_num="+minor_num;
		frames["HIDE_ACTION"].location.href = sFile;
	}
	function addOutSettle (gubun) {
		outCount = Number(frmOut.outCount.value); 
		val = $("#OutSiteData").html();
		aNum = Array();
		aPro = Array();
		aQun = Array();
		aUni = Array();
		aPri = Array();
		aAuh = Array();
		aDat = Array();
		aNot = Array();
		aSit = Array();
		for (ii = 1 ; ii < outCount + 1; ii ++) {
			if (eval("document.frmOut.outNum_"+ii)) {
				aNum[ii] = eval("document.frmOut.outNum_"+ii).value; 
				aPro[ii] = eval("document.frmOut.outPro_"+ii).value; 
				aQun[ii] = eval("document.frmOut.outQun_"+ii).value; 
				aUni[ii] = eval("document.frmOut.outUni_"+ii).value; 
				aPri[ii] = eval("document.frmOut.outPri_"+ii).value; 
				aAuh[ii] = eval("document.frmOut.outAuh_"+ii).value; 
				aDat[ii] = eval("document.frmOut.outDat_"+ii).value; 
				aNot[ii] = eval("document.frmOut.outNot_"+ii).value; 
				aSit[ii] = eval("document.frmOut.outSit_"+ii).value; 
			}
		}
		val = val.replace("<tbody>","");
		val = val.replace("</tbody>","");
		outCount ++;
		frmOut.outCount.value = outCount;
		data = "\
			<tr >\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outNum_"+outCount+"' id='outNum_"+outCount+"' class='form-control form-control-sm d-inline ac' value='"+outCount+"'></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outPro_"+outCount+"' id='outPro_"+outCount+"' class='form-control form-control-sm d-inline'    value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outQun_"+outCount+"' id='outQun_"+outCount+"' onChange=\"return addPriceChange('"+outCount+"')\" class='form-control form-control-sm d-inline ac' value='1'></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outUni_"+outCount+"' id='outUni_"+outCount+"' onChange=\"return addPriceChange('"+outCount+"')\" class='form-control form-control-sm d-inline ar' value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outPri_"+outCount+"' id='outPri_"+outCount+"' class='form-control form-control-sm d-inline ar' value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outAuh_"+outCount+"' id='outAuh_"+outCount+"' class='form-control form-control-sm d-inline ac' value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outDat_"+outCount+"' id='outDat_"+outCount+"' class='form-control form-control-sm d-inline ac' value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  ><input type='text' name='outNot_"+outCount+"' id='outNot_"+outCount+"' class='form-control form-control-sm d-inline'    value=''></td>\
				<td class='regis-hotel-td3 border-rt-1'  >\
					<input type='text' name='outSit_"+outCount+"' id='outSit_"+outCount+"' class='form-control form-control-sm d-inline wh80'    value='' onChange=\"siteCheck2(this.value,'"+outCount+"')\">\
					<input type='text' name='outSit2_"+outCount+"' readonly id='outSit2_"+outCount+"' class='form-control form-control-sm d-inline wh100'   value='' >\
					<div style='position:relative'>\
						<div style='position:absolute;top:0;left:0px;z-index:10;' ID='SiteSearch"+outCount+"'></div>\
					</div>\
				</td>\
				<td class='regis-hotel-td3 border-rt-1'  id='outButton_"+outCount+"'><span class='btn_basic btn_blue' onClick=\"return outSiteSave('"+outCount+"','"+gubun+"')\">저장</span></td>\
			</tr>\
			";
		$("#OutSiteData").html(val + data);
		for (ii = 1 ; ii < outCount ; ii ++) {
			if (eval("document.frmOut.outNum_"+ii)) {
				eval("document.frmOut.outNum_"+ii).value = aNum[ii] ;
				eval("document.frmOut.outPro_"+ii).value = aPro[ii] ;
				eval("document.frmOut.outQun_"+ii).value = aQun[ii] ;
				eval("document.frmOut.outUni_"+ii).value = aUni[ii] ;
				eval("document.frmOut.outPri_"+ii).value = aPri[ii] ;
				eval("document.frmOut.outAuh_"+ii).value = aAuh[ii] ;
				eval("document.frmOut.outDat_"+ii).value = aDat[ii] ;
				eval("document.frmOut.outNot_"+ii).value = aNot[ii] ;
				eval("document.frmOut.outSit_"+ii).value = aSit[ii] ;
			}
		}
	}

	async function outSiteSave (cnt,field) {
		Obj = document.frmOut;
		Obj.current.value = cnt;
		Obj.mode.value    = 'outSettle';
		num = eval("document.frmOut.outNum_"+cnt).value;
		pro = eval("document.frmOut.outPro_"+cnt).value;
		qun = eval("document.frmOut.outQun_"+cnt).value;
		uni = eval("document.frmOut.outUni_"+cnt).value;
		pri = eval("document.frmOut.outPri_"+cnt).value;
		auh = eval("document.frmOut.outAuh_"+cnt).value;
		dat = eval("document.frmOut.outDat_"+cnt).value;
		not = eval("document.frmOut.outNot_"+cnt).value;
		site = eval("document.frmOut.outSit_"+cnt).value;
		if (pro == "") {
			alert("품목 및 규격을 입력하세요");
		} else if (qun == "") {
			alert("수량을 입력하세요");
		} else if (uni == "") {
			alert("단가를 입력하세요");
		} else if (pri == "") {
			alert("합계금액을 입력하세요");
		} else {
			var Rc = confirm("저장합니다.");
			if (Rc) {
				json = await dataSaveSend ('frmOut','/order/orderSave');
				success = json.success;
				if (success === "ok") {
					location.reload();
				} else {
					newAlert('저장중 오류 발생');
				}
			}
		}
		return false;
	}
	async function outSiteDel (cnt) {
		Obj = document.frmOut;
		Obj.current.value = cnt;
		Obj.mode.value    = 'outSettleDel';
		var Rc = confirm("한줄 삭제 합니다.");
		if (Rc) {
			//sFile = "../order/order_save.php?mode=outSettleDel&order_num="+order_num+"&cnt="+cnt;
			//frames["HIDE_ACTION"].location.href = sFile;
			json = await dataSaveSend ('frmOut','/order/orderSave');
			success = json.success;
			if (success === "ok") {
				location.reload();
			} else {
				newAlert('저장중 오류 발생');
			}
		}
	}
	function outSettleWrite (goods_code,minor,field) {
		var sFile = "../bill/out_settle.html?mode=orderSettle&"+field+"="+goods_code+"&minor="+minor;
		OpenWindowA(sFile,"",0,1000,473);
	}
	function addPriceChange (cnt) {
		qun = eval("document.frmOut.outQun_"+cnt).value;
		uni = eval("document.frmOut.outUni_"+cnt).value;
		pr  = qun * uni;
		eval("document.frmOut.outPri_"+cnt).value = pr;
	}

	function dayoutCheck (tourNumber,startDay,uid,salePrice) {
		Obj       = document.frmForm;
		Obj.tourNumber.value  = tourNumber;
		Obj.start_day.value   = startDay;
		Obj.totalAmount.value = salePrice;
		Obj.uid.value         = uid;
		backGroundLayerOpen();
		Obj.action = "dayout_register.html";
		Obj.target = "HIDE_ACTION";
		Obj.submit();
	}
	function alramSend (gubun,order_num) {
		if (gubun != "") {
			var Rc = confirm("알람을 전송합니다.");
			if (Rc) {
				sFile = "../order/alram_send.php?mode="+gubun+"&order_num="+order_num;
				frames["HIDE_ACTION"].location.href = sFile;
			}
		}
	}

	function hideMenu2 (minor) {
		$("#SiteSearch"+minor).hide();
	}
	function siteInsert2 (code,name,minor) {
		eval("document.frmOut.outSit_"+minor).value  = code;
		eval("document.frmOut.outSit2_"+minor).value = name;
		hideMenu2  (minor);
	}
	function siteInsert3 (code,name) {
		eval("document.frmReserve.site_code").value  = code;
		eval("document.frmReserve.site_name").value = name;
		sFile = "../inter/manager_set.php?code="+code;
		frames["HIDE_ACTION"].location.href = sFile;
		$("#SiteSearch").hide();
	}
	function siteInsert4 (code,name) {
		eval("document.frmForm.siteCode").value  = code;
		eval("document.frmForm.siteName").value  = name;
		$("#SiteSearch").hide();
	}
	//2024-05-13 감동 상품 하위거래처
	function siteInsert5 (code,name) {
		eval("document.frmForm.slave_site").value  = code;
		eval("document.frmForm.slave_name").value  = name;
		$("#SiteSearch101").hide();
	}
	function viewOrderDetail (uid) {
		//$("#OrderDetail_"+uid).show();
		sFile = "../order/order_view.php?uid="+uid;
		frames["HIDE_ACTION"].location.href = sFile;
	}
	function tmrCheck(pnr,uid,crs) {
		if (crs == "") crs = "G";
		if (crs == "S") frmForm1.command.value = "RT "+pnr;
		else frmForm1.command.value = "*"+pnr;
		frmHiddenTerm.uid.value = uid;
		frmHiddenTerm.pnr.value = pnr;
		frmHiddenTerm.crs.value = crs;
		acTion1();
	}

	function dropLoadStart(str) {
		rs = loadStartCircle (str);
		smallPopShow ("",270,270);
		$("#smallPopupData").html(rs);
	}

	function whiteLoadStart(str) {
		rs = loadStartCircle (str);
		smallPopWhiteShow ("",270,270);
		$("#smallPopupWhiteData").html(rs);
	}

	function loadStart (str) {
		rs = "\
			<div class='loading_form_circle_main' >\
				<div class='loading_form_circle'>\
					<img src='../swf/loading.gif' alt='' class='airplane_load' style='display:block;margin:0 auto;'>\
				</div>\
				<p class='ac font13 mat10'>"+str+"</p>\
			</div>\
		";
		return rs;
	}
	function loadStartCircle (str) {
		rs = "\
			<div class='loading_form_circle_main' >\
				<div class='loading_form_circle'>\
					<img src='../swf/loading.gif' alt='' class='airplane_load' style='display:block;margin:0 auto;'>\
				</div>\
				<p class='ac font13 mat10'>"+str+"</p>\
			</div>\
		";
		return rs;
	}
	function shadowLoadStart (str) {
		rs = "";
		for (var i = 0; i < 10; i++){
			rs += `
			<div class="a-list-item">
				<ul>
					<li class="n1">
						<span class="beforeCreateLoading" style="width: 41%;"></span> 
						<span class="beforeCreateLoading"  style="width: 41%;"></span>  
					</li>
					<li class="t1 virtual">
						<span class="beforeCreateLoading"  style="width: 20%;"></span>
						<span class="bold beforeCreateLoading"  style="width: 30%;"></span>
					</li>
					<li class="t1">
						<span class="beforeCreateLoading"  style="width: 20%;"></span>
						<span class="bold beforeCreateLoading"  style="width: 30%;"></span>
					</li>
					<li class="t2">
						<span class="beforeCreateLoading"  style="width: 50%;"></span>
						<span class="baggage-t beforeCreateLoading"  style="width: 60%;"></span>
					</li>
					<li class="p1">
						<span class="price beforeCreateLoading"  style="width: 50%;"></span>
					</li>
					<i class='fas fa-chevron-down' style='    position: absolute;top: 9px;right: 11px;width: 10px;font-size: 22px;opacity: 0.4'></i>

				</ul>	
			</div>`;
		}
		return rs;
	}

	function smallPopShow (sFile,w,h) {
		$("#smallPopup").show();
		$("#smallPopup_arti").css({ width : w+ "px", height: h+ "px"});
		//if (sFile != "") frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}
	function smallPopHide () {
		$("html, body").css({"overflow":"auto"});
		$("#smallPopup").hide();
	}

	function smallPopShow2 (val) {
		sFile = "../site/site_check.html?val="+val;
		smallPopShow (sFile,500,500);
	}

	function smallPopSecShow (sFile,w,h) {
		$("#smallPopupSec").show();
		$("#smallPopupSec_arti").css({ width : w+ "px", height: h+ "px"});
		//if (sFile != "") frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}

	function smallPopWhiteShow (sFile,w,h) {
		$("#smallPopupWhite").show();
		$("#smallPopup_arti").css({ width : w+ "px", height: h+ "px"});
		//if (sFile != "") frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}
	function smallPopHide () {
		$("html, body").css({"overflow":"auto"});
		$("#smallPopup").hide();
	}
	function smallPopSecHide () {
		$("#smallPopupSec").hide();
	}

	function SeatCheck(uid) {
		//sFile = "../interline/seat_check.html?uid="+uid;
		sFile = "../Seat/seat_check.html?uid="+uid;
		OpenWindowA(sFile,"",1,1000,880);
	}


	function loadCircle (data) {
		$(".load-popup").show();
		if (data != "") document.getElementById("loading-text").innerHTML = data;
	}

	function loadCircleHide () {
		$(".load-popup").hide();
	}
	function reqRefund(uid,ticket_number,air_line_code,join) {
		if (join == "Prime") sFile = "../aviationPrime/site_refund.html?mode=Auto&ticket_number="+ticket_number+"&air_line_code="+air_line_code;
		else sFile = "../aviation/site_refund.html?mode=Auto&ticket_number="+ticket_number+"&air_line_code="+air_line_code;
		OpenWindowA(sFile,"",0,1000,730);
		return false;
	}
	function visualCreate (order_num) {
		bank_cd = settleFrm.bank_cd.value;
		bank_tl = settleFrm.bank_tl.value;
		bank_amount = StrClear(settleFrm.bank_amount.value);
		order_name  = frmForm.order_name.value;
		handphone   = StrClear(frmForm.handphone.value);
		if (bank_cd == "") {
			alert("입금은행을 선택하세요!");
		} else if (bank_tl == "") {
			alert("입금 마감시한을 선택하세요!");
		} else if (bank_amount == "") {
			alert("입금 금액을 설정하세요!");
		} else {
			var Rc= confirm("생성을 시작합니다.");
			if (Rc) {
				sFile = "order_save.php?mode=AccountCreate&bank_cd="+bank_cd+"&bank_tl="+bank_tl+"&bank_amount="+bank_amount+"&order_name="+order_name+"&order_num="+order_num+"&handphone="+handphone;
				frames["HIDE_ACTION"].location.href = sFile;
			}
		}
		return false;
		
	}
	function visualPartnerCreate (order_num) {
//		bank_cd = settleFrm.bank_cd.value;
		bank_tl = settleFrm.bank_tl.value;
		bank_amount = StrClear(settleFrm.bank_amount.value);
		order_name  = frmForm.order_name.value;
		handphone   = StrClear(frmForm.handphone.value);
		if (bank_tl == "") {
			alert("입금 마감시한을 선택하세요!");
		} else if (bank_amount == "") {
			alert("입금 금액을 설정하세요!");
		} else {
			var Rc= confirm("생성을 시작합니다.");
			if (Rc) {
				sFile = "order_save.php?mode=AccountPartnerCreate&bank_tl="+bank_tl+"&bank_amount="+bank_amount+"&order_name="+order_name+"&order_num="+order_num+"&handphone="+handphone;
				frames["HIDE_ACTION"].location.href = sFile;
			}
		}
		return false;
		
	}

	function visualClear (order_num) {
		var Rc= confirm("생성을 삭제합니다.");
		if (Rc) {
			sFile = "order_save.php?mode=AccountClear&order_num="+order_num;
			frames["HIDE_ACTION"].location.href = sFile;
		}
	}
	function newsDown (uid) {
		sFile = "../lib/file_save.php?mode=News&uid="+uid;
		frames["HIDE_ACTION"].location.href = sFile;
	}

	function gubunChange (s) {
		if (s == "1") {
			$(".proof").fadeIn();
		}else{
			$(".proof").fadeOut();
		}

		if(s == "1"){
			frmOne.subject.value  = "현금영수증";
			frmOne.contents.value = "현금영수증 요청";
		}else if (s == "2"){
			frmOne.subject.value  = "스케줄변경 및 재발행문의";
			frmOne.contents.value = "스케줄변경 및 재발행문의";
		}else if (s == "3"){
			frmOne.subject.value  = "발권문의";
			frmOne.contents.value = "발권문의";
		}else if (s == "4") {
			frmOne.subject.value  = "수화물추가";
			frmOne.contents.value = "수화물추가요망";
		}else if (s == "7"){
			frmOne.subject.value  = "휠체어 서비스";
			frmOne.contents.value = "휠체어 서비스 요청";
		}else if (s == "8"){
			frmOne.subject.value  = "환불문의";
			frmOne.contents.value = "환불문의";
		}else if (s == "9"){
			frmOne.subject.value  = "기타문의";
			frmOne.contents.value = "기타문의";
		}
	}
	function siteReqRefund(uid,ticket_number,air_line_code) {
		if (uid == "") {
			alert("주문서가 없어서 환불 요청이 되지 않습니다. 관리자에게 연락 하시기 바랍니다.");
		} else {
			if (frmForm.refund_type.value == "") {
				alert("환불 형태를 선택하여 주세요");
			} else {
				var Rc = confirm("환불 요청을 하시겠습니까?");
				if (Rc) {
					var sFile = "../interline/refund_req.php?uid="+uid+"&ticket_number="+ticket_number+"&air_line_code="+air_line_code;
					frames["HIDE_ACTION"].location.href = sFile;
				}
			}
		}
		return false;
	}
	function createRefund(ticket_number,air_line_code,refund_type,site_uid,uid,ref_uid,gubun) {
		if (ref_uid != "") var sFile = "../aviation/new_refund.php?mode=modify&uid="+ref_uid;
		else if (gubun == "Prime") var sFile = "../aviationPrime/new_refund.php?mode=Auto&ticket_number="+ticket_number+"&air_line_code="+air_line_code+"&refund_type="+refund_type+"&site_uid="+site_uid;
		else var sFile = "../aviation/new_refund.php?mode=Auto&ticket_number="+ticket_number+"&air_line_code="+air_line_code+"&refund_type="+refund_type+"&site_uid="+site_uid;
		OpenWindowA(sFile,"",0,850,730);
		//if (site_uid != "") reqRefund(uid,air_line_code,site_uid,ref_uid) ;
	}
	function cancelRefund (uid,minor_num,refund_res_time) {
		if (refund_res_time != "") {
			alert(refund_res_time + " 이미 환불 처리 되어 있습니다. 확인하시기 바랍니다." );
		} else {
			var Rc = confirm("환불 요청을 취소 합니다.");
			if (Rc) {
				var sFile = "../interline/refund_req.php?mode=cancel&uid="+uid+"&minor_num="+minor_num;
				frames["HIDE_ACTION"].location.href = sFile;
			}
		}
	}

	function beforePaxCheck (cnt) {
		name1 = document.getElementById("tename1_"+cnt).value;
		name2 = document.getElementById("tename2_"+cnt).value;
		//console.log(name1 + " " + name2);
		if (name1.length > 1) {
			sFile = "../interV2/pax_check.php?name1="+name1+"&name2="+name2+"&cnt="+cnt;
			frames["HIDE_ACTION"].location.href = sFile;
		}
	}
	function paxInsert (cnt,name1,name2,gender,country,passport,birthday,expired,tel_number) {
		document.getElementById("tename1_"+cnt).value   = name1;
		document.getElementById("tename2_"+cnt).value   = name2;
		document.getElementById("tpassport_"+cnt).value = passport;
		document.getElementById("tbirth_"+cnt).value    = birthday;
		document.getElementById("texpire_"+cnt).value   = expired;
		//document.getElementById("ttel1_"+cnt).value     = tel_number;
		Obj = document.getElementById("tsex_"+cnt);
		len = Obj.length ;
		for (ix = 0 ; ix < len ; ix ++ ){
			//console.log(Obj[ix].value + " " + gender);
			if (Obj[ix].value == gender) {
				Obj.selectedIndex = ix;
				break;
			}
		}
		Obj = document.getElementById("tcountry_"+cnt);
		len = Obj.length ;
		for (ix = 0 ; ix < len ; ix ++ ){
			//console.log(Obj[ix].value + " " + country);
			if (Obj[ix].value == country) {
				Obj.selectedIndex = ix;
				break;
			}
		}
		document.getElementById("beforePax").style.display = "none";
	}
	function pnrTrancCheck() {
		pnr       = trim(document.frmReserve.pnr.value);
		site_code = trim(document.frmReserve.site_code.value);
		CRS       = trim(document.frmReserve.CRS.value);
		itinerary = trim(document.frmReserve.itinerary.value);
		if (pnr == "") { 
			alert("PNR 입력후 진행 하세요");
		} else if (site_code == "") { 
			alert("거래처코드를 입력후 진행 하세요");
		} else if (CRS == "S" && itinerary == "") { 
			alert("PNR 정보를 단말기 상태 그대로 입력후 진행 하세요");
		} else {
			alert("작업이 진행 됩니다.");
			document.getElementById("ActionButton").innerHTML = "";
			document.frmReserve.submit();
		}
		return false;
	}
	async function priceReCheck (uid,pos,mode) {
		if (mode == "Y") var Rc = true; // 2022-12-02 pnr devide 후에 넘어 올때
		else var Rc = confirm("요금 재확인 시작 합니다.");
		if (Rc) {
			dropLoadStart ("요금 재생성 중입니다.");
			//sFile = "../interline/price_re_check.php?uid="+uid+"&pos="+pos;
			//frames["HIDE_ACTION"].location.href = sFile;
			json = await dataGhangeSend('','', uid , '', '', '',file='interSearch/priceCheck');
			msg = json.msg;
			success = json.success;
			if (msg) newAlert(msg);
			smallPopHide();
			if (success === "ok") {
				pnrCheck (uid , 'reCheck');
			}
		}
		return false;
	}

	function MenuSearch(){
		var value = $("#menuSearchWord").val();
		$('.collapse li a').removeClass("cored");
		$('.collapse').removeClass("show");
		$('.collapse li a').each(function(index){
			text = $(this).text().toLowerCase(); //메뉴명
			if (text.indexOf(value.toLowerCase()) != -1 && value != '') {
				parent.$(this).addClass("cored"); // 검색메뉴 색상 변경
				$(this).parents('.collapse').addClass("show"); // 검색메뉴 상단창 보이기
			}
		});
	}

	function datePick (id) {
		if ($("#"+id).hasClass('hasDatepicker')) return; 
		$("#"+id).datepicker({
		//$t.datepicker({
			dateFormat: 'yy-mm-dd' //달력 날짜 형태
			,showOtherMonths: true //빈 공간에 현재월의 앞뒤월의 날짜를 표시
			,showMonthAfterYear:true // 월- 년 순서가아닌 년도 - 월 순서
			,changeYear: true //option값 년 선택 가능
			,changeMonth: true //option값  월 선택 가능                
			//,showOn: "both" //button:버튼을 표시하고,버튼을 눌러야만 달력 표시 ^ both:버튼을 표시하고,버튼을 누르거나 input을 클릭하면 달력 표시  
			//,buttonImage: "http://jqueryui.com/resources/demos/datepicker/images/calendar.gif" //버튼 이미지 경로
			//,buttonImageOnly: true //버튼 이미지만 깔끔하게 보이게함
			//,buttonText: "선택" //버튼 호버 텍스트              
			,yearSuffix: "년" //달력의 년도 부분 뒤 텍스트
			,monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] //달력의 월 부분 텍스트
			,monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] //달력의 월 부분 Tooltip
			,dayNamesMin: ['일','월','화','수','목','금','토'] //달력의 요일 텍스트
			,dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] //달력의 요일 Tooltip
			,minDate: "-5Y" //최소 선택일자(-1D:하루전, -1M:한달전, -1Y:일년전)
			,maxDate: "+5y" //최대 선택일자(+1D:하루후, -1M:한달후, -1Y:일년후)  
		});
		$("#"+id).datepicker('show');

		//초기값을 오늘 날짜로 설정해줘야 합니다.
		//$("#"+id).datepicker('setDate', 'today'); //(-1D:하루전, -1M:한달전, -1Y:일년전), (+1D:하루후, -1M:한달후, -1Y:일년후)            
	}


	function copyClip(val,gubun) {
		var dummy = document.createElement("textarea");
		document.body.appendChild(dummy);
		dummy.value = val;
		dummy.select();
		document.execCommand("copy");
		document.body.removeChild(dummy);
		if (gubun == "New") {
			//window.open("//www."+val);
			window.open(val);
		}
	}

	function Lan__ (word) {
		return top.aLanguageWord[word][top.oyeManagerLanguage];
	}

	function leftMenuHide(){
		if($(window).width() < 1670){
			if(parent.$("#left-wrap").hasClass("active") !== true) {
				$('#left-wrap, #content').addClass('active');
				$('#toogle-menu').prop("checked", true);
			}
		}
	}

	function layerOnOff(s){
		if(s == 1){
			$(".category_item_layer").css("height","auto");
			$("#layer_Add").hide();
			$("#layer_close").show();
		}else{
			$(".category_item_layer").css("height","69px");
			$("#layer_Add").show();
			$("#layer_close").hide();
		}
	}

	function searchPagingChange (page) {
		if (page === "+") {
			page = parseInt(frmSearch.page.value) + 1;
		} else if (page === "-") {
			page = parseInt(frmSearch.page.value) - 1;
			if (page < 1) page = 1;
		}
		else page = parseInt(page);
		frmSearch.page.value = page;
		formSearch (event,page);
		return false;
	}
	// 여기까지

	function newAlert(msg,next='') {
		top.$('.alert_layer_wrap').show();
		msg = msg.replace(/\n/g, '<br>');
		top.$('#alert_layer_text').html(msg);
		//console.log(msg + ' ' + next)
		if (next  === "reload") act = `<button class="cursor btn_ok" onClick="newAlertHide();location.reload();">확인</button>`;
		else act = `<button class="cursor btn_ok" onClick="newAlertHide()">확인</button>`;
		top.$('#alertLayerAction').html(act);
	}
	function newAlertHide(msg='') {
		top.$('.alert_layer_wrap').hide();
	}
	// function pngSave(id,saveName){
	// 	alert("이미지 생성중입니다 \n\n확인후 잠시만 기다려주세요.");
	// 	//domtoimage.toBlob(document.getElementById(id)).then(function (blob) {
	// 	//	window.saveAs(blob, saveName+".png");
	// 	//});
	// 	html2canvas(document.getElementById(id)).then(function (canvas) {			
	// 	var anchorTag = document.createElement("a");
	// 		document.body.appendChild(anchorTag);
	// 		//document.getElementById("previewImg").appendChild(canvas);
	// 		anchorTag.download = saveName+".png";
	// 		anchorTag.href = canvas.toDataURL();
	// 		//anchorTag.target = '_blank';
	// 		anchorTag.click();
	// 	});
	// }
	function pngSave(id, saveName) {
		alert("이미지 생성중입니다\n\n확인 후 잠시만 기다려주세요.");
	  
		html2canvas(document.getElementById(id)).then(canvas => {
		  canvas.toBlob(blob => {
			const url = URL.createObjectURL(blob);
	  
			const a = document.createElement("a");
			a.href = url;
			a.download = saveName + ".png";
			a.click();
	  
			URL.revokeObjectURL(url); // 메모리 해제
		  });
		});
	}
	function doubleChange (A,B) {
		$("#"+A).hide();
		$("#"+B).show();
	}

// 2024-01-15 스크립트로 한달간 신규 기능 오픈 시켜 주는 기능
//<div class="ui-tooltip2 arrow2 top">d adsfasdf  dfas fas d</div>
	function newTool(sessName, data , exp) {
		cookie = getCookie(sessName+"_DATA");
		if (cookie == "" && exp > top.NOWS) {
			document.write("<div class='ui-tooltip2 arrow2 top' onClick=\"event.cancelBubble=true;newToolClose('"+sessName+"')\" id='"+sessName+"'>"+data+"</div>");
			setTimeout("newToolSizeCheck ('"+sessName+"')",100);
		}
	}
	function newToolSizeCheck (sessName) {
		hh = $("#"+sessName).css ("top" , - $("#"+sessName).height() - 32 + "px" );
		ww = $("#"+sessName).css ("left" , - $("#"+sessName).width()/2 + 12 + "px");
		
	}
	function newToolClose (sessName) {
		$("#"+sessName).hide();
		setCookie (sessName+"_DATA","Y",30);
	}
	function clog(str) {
		console.log(str);
	}
	
	async function dataGetSend(mode='', uid='',file='dataGet') {
		const data = "mode="+mode+"&uid="+uid;
		try {
			const res  = await fetch(`/${file}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: data
			});
			const json  = await res.json();
			success = json.success;
			if (success == "ok") {
				return json;
			} else {
				console.log("데이터 가져오는중 외부 오류 발생"+json);
			}
		} catch (err) {
			console.log("데이터 가져오는중 내부 오류 발생 " + err)
		}
	}

	async function dataGhangeSend(mode='',table='', uid='',minor_num='',field='',val='',file='dataChange') {
		const data = "mode="+mode+"&table="+table+"&uid="+uid+"&minor_num="+minor_num+"&field="+field+"&val="+val;
		try {
			const res  = await fetch(`/${file}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: data
			});
			const json  = await res.json();
			success = json.success;
			if (success == "ok") {
				return json;
			} else {
				console.log("데이터 가져오는중 외부 오류 발생"+json);
				return json;
			}
		} catch (err) {
			console.log("데이터 가져오는중 내부 오류 발생 " + err)
		}
	}

	async function dataSaveSend(obj,file,type='') {
		// Action 이 걸리는것은 모두 사용 post
		const form = document.getElementById(obj); 
		const formData = new FormData(form);
		const options = {
			method: 'POST'
		};
		if (type === "file") {
			options.body =  formData
		} else {
			const params   = new URLSearchParams();
			for (const [key, value] of formData.entries()) {
				params.append(key, value);
			}
			options.headers = { 'Content-Type': 'application/x-www-form-urlencoded'} ;
			options.body = params.toString();
		}
		try {
			const res  = await fetch(`${file}`,options );
			json = await res.json();
			//console.log(json.success);
			return json;
		} catch (err) {
			console.log("파일 저장시 내부 오류 발생 " + err)
		}
	}

	function hidePrintAction(html) {
		const w = document.getElementById('hidePrint').contentWindow; 
		const doc = w.document;
		const htmlDoc = `
		<!doctype html>
		<html>
		<head>
		  <meta charset="utf-8">
		  <base href="${document.baseURI}">
		  <link rel="stylesheet" href="/css/common.css">
		  <link rel="stylesheet" href="/css/new_main.css">
		  <link rel="stylesheet" href="/css/style.css">
		  <link rel="stylesheet" href="/css/content.css">
		  <link rel="stylesheet" href="/css/airStyle.css">
		  <link rel="stylesheet" href="/css/modal.css">
		  <style>@page{ size:A4; margin:12mm; }</style>
		</head>
		<body>${html}</body>
		</html>`;
		doc.open();
		doc.write(htmlDoc);
		doc.close();
		w.focus();
		setTimeout(() => {
			w.print();
		}, 1000);
	}

	