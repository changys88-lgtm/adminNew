
	//
	//airType = new Array();
	//airType["TW"] = new Array();
	//
	//airType["TW"]["GMP"] = ["CJU","KWJ","PUS"];
	//airType["TW"]["TAE"] = ["CJU"];
	//airType["TW"]["CJU"] = ["GMP","PUS","TAE","CJJ","KWJ"];
	//airType["TW"]["CJJ"] = ["CJU"];
	//airType["TW"]["PUS"] = ["GMP","CJU","YNY"];
	//airType["TW"]["YNY"] = ["PUS","KWJ"];
	//airType["TW"]["KWJ"] = ["GMP","CJU","YNY"];
	//
	//DomesticAirPort = ["GMP","CJU","PUS","KWJ","TAE","CJJ","YNY"];
	//
	//DomesticAirPortName = new Array ();
	//
	//DomesticAirPortName["GMP"] = "김포";
	//DomesticAirPortName["CJU"] = "제주";
	//DomesticAirPortName["PUS"] = "부산";
	//DomesticAirPortName["KWJ"] = "광주";
	//DomesticAirPortName["TAE"] = "대구";
	//DomesticAirPortName["CJJ"] = "청주";
	//DomesticAirPortName["YNY"] = "양양";
	//

	DomesticAirPort = ["GMP","CJU","PUS","KWJ","TAE","CJJ","ICN","KPO","KUV","MWX","HIN","RSU","USN","WJU","YNY"];

	DomesticAirPortName = new Array ();

	DomesticAirPortName["GMP"] = "김포";
	DomesticAirPortName["CJU"] = "제주";
	DomesticAirPortName["CJJ"] = "청주";
	DomesticAirPortName["PUS"] = "부산";
	DomesticAirPortName["TAE"] = "대구";
	DomesticAirPortName["KWJ"] = "광주";
	DomesticAirPortName["ICN"] = "인천";
	DomesticAirPortName["KPO"] = "포항";
	DomesticAirPortName["KUV"] = "군산";
	DomesticAirPortName["MWX"] = "무안";
	DomesticAirPortName["HIN"] = "진주";
	DomesticAirPortName["RSU"] = "여수";
	DomesticAirPortName["USN"] = "울산";
	DomesticAirPortName["WJU"] = "원주";
	DomesticAirPortName["YNY"] = "양양";

	airRouteType = new Array();
	airRouteType["GMP"] = ["CJU","PUS","TAE","KWJ","KPO","MWX","HIN","RSU","USN"];
	airRouteType["CJU"] = ["GMP","CJJ","PUS","TAE","KWJ","ICN","KPO","KUV","MWX","HIN","RSU","USN","WJU","YNY"];
	airRouteType["CJJ"] = ["CJU"];
	airRouteType["PUS"] = ["CJU","GMP","KWJ","YNY"];
	airRouteType["TAE"] = ["CJU","GMP","YNY"];
	airRouteType["KWJ"] = ["CJU","GMP","PUS","YNY"];
	airRouteType["ICN"] = ["CJU"];
	airRouteType["KPO"] = ["CJU","GMP"];
	airRouteType["KUV"] = ["CJU","GMP"];
	airRouteType["MWX"] = ["CJU","GMP","USN"];
	airRouteType["HIN"] = ["CJU","GMP"];
	airRouteType["RSU"] = ["CJU","GMP","YNY"];
	airRouteType["USN"] = ["CJU","GMP","MWX"];
	airRouteType["WJU"] = ["CJU","GMP"];
	airRouteType["YNY"] = ["CJU","PUS","KWJ","RSU","TAE"];

	function airSet (dep,arr) {
		list1 = "";
		for (ix = 0 ; ix < DomesticAirPort.length ; ix ++) {
			code = DomesticAirPort[ix];
			if (code == dep) chk = "checked"; else chk = "";
			list1 += `
				<li>
					<div class="check-group check-group2 custom-checkbox">
						<input class="custom-control-input" type="checkbox" name="depCheck" ${chk} onClick="depChange('${code}','${DomesticAirPortName[code]}')"><label onClick="depChange('${code}','${DomesticAirPortName[code]}')" class="custom-control-label domestic-city" >${DomesticAirPortName[code]} 공항</label>
					</div>
				</li>
			`;
		}
		document.getElementById("depArea").innerHTML = list1;
		arriveSet (dep,arr);
	}
	function arriveSet (dep,arr) {
		list1 = "";
		arrCode = "";
		arrName = "";
		for (ix = 0 ; ix < airRouteType[dep].length ; ix ++) {
			code = airRouteType[dep][ix];
			if (arr == "" && ix == 0) arr = code;
			if (code == arr) {
				chk = "checked"; 
				arrCode = code;
				arrName = DomesticAirPortName[code];
			} else chk = "";
			list1 += `
				<li>
					<div class="check-group check-group2 custom-checkbox">
						<input class="custom-control-input" type="checkbox" name="arrCheck" ${chk} onClick="arrChange('${code}','${DomesticAirPortName[code]}')"><label class="custom-control-label domestic-city" onClick="arrChange('${code}','${DomesticAirPortName[code]}')">${DomesticAirPortName[code]} 공항</label>
					</div>
				</li>
			`;
		}
		document.getElementById("arrArea").innerHTML = list1;
		frmForm.arrCode.value = arrCode;
		frmForm.arrName.value = arrName;
	}

	function typeChange(s) {
		Obj = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		if (ticket_type != s) {
			$("#ticketType"+ticket_type).toggleClass("is-checked");
			ticket_type = s;
			Obj.ticket_type.value = ticket_type;
			$("#ticketType"+ticket_type).toggleClass("is-checked");
			if (ticket_type == "1") {
				$("#arrDateArea").hide();
			} else if (ticket_type == "2") {
				$("#arrDateArea").show();
			}
		}
	}

	function depChange (code,name) {
		frmForm.depCode.value = code;
		frmForm.depName.value = name;
		startClose ();
		endOpen ();
		arriveSet (code,'');
	}
	function arrChange (code,name) {
		frmForm.arrCode.value = code;
		frmForm.arrName.value = name;
		endClose();
	}
	function memChange (s,title) {
		adt = Number(frmForm.adtMem.value);
		chd = Number(frmForm.chdMem.value);
		inf = Number(frmForm.infMem.value);
		mem = adt + chd + inf;
		msg = "";
		if (mem > 8 && s == "+") {
			msg = "최대 9명 까지 예약이 가능합니다.";
		} else if (title == "adt") {
			if (s == "+") adt ++;
			else if (s == "-" && adt > 1) adt --;
		} else if (title == "chd") {
			if (s == "+") chd ++;
			else if (s == "-" && chd > 0) chd --;
		} else if (title == "inf") {
			if (s == "+") inf ++;
			else if (s == "-" && inf > 0) inf --;
		}
		if (inf > adt) {
			msg += " 성인인원보다 유아 인원이 많습니다. 유아 인원을 줄여 주세요";
		}
		if (msg != "") {
			alert(msg);
		} 
		if (chd > 0) $("#chdArea").show();
		else $("#chdArea").hide();
		if (inf > 0) $("#infArea").show();
		else $("#infArea").hide();

		//Obj.action = "../dome/airPrice_confirm.php";
		//Obj.submit();
	}
	function memActive () {
		adt = Number(frmForm.adtMem.value);
		chd = Number(frmForm.chdMem.value);
		inf = Number(frmForm.infMem.value);
		frmForm.memberName.value = "성인"+adt+"명,소아"+chd+"명,유아"+inf+"명";
		memberClose ();
	}
	function openCalendar (pos) {
		$('#listcal_solo').toggle();
		dep_date = frmForm.dep_date.value;
		arr_date = frmForm.arr_date.value;
		sFile = "list_cal.php?pos="+pos+"&dep_date="+dep_date+"&arr_date="+arr_date;
		frames["HIDE_ACTION"].location.href = sFile;
	}
	function setDate (pos, date , date1) {
		dep_date = StrClear(frmForm.dep_date.value);
		arr_date = StrClear(frmForm.arr_date.value);
		if (date > arr_date && pos == "dep_date") frmForm.arr_date.value = CutDate(date1);
		$('#listcal_solo').toggle();
		if (pos == "dep_date") {
			frmForm.dep_date.value = CutDate(date);
			openCalendar ("arr_date");
		} else {
			frmForm.arr_date.value = CutDate(date);
		}
	}
	async function searchAction () {
		$("#reserveButton").hide();
		dep_date    = StrClear(document.frmForm.dep_date.value);
		arr_date    = StrClear(document.frmForm.arr_date.value);
		depCode     = document.frmForm.depCode.value;
		arrCode     = document.frmForm.arrCode.value;
		airType     = document.frmForm.airType.value;
		ticket_type = document.frmForm.ticket_type.value;
		if (!dep_date) {
			 alert("춟발일자를 선택하세요");
		} else if (!arrCode) {
			alert("도착도시를 선택하여 주세요!");
		} else if (arr_date < dep_date && ticket_type == "2") {
			alert("귀국일자를 다시 선택하여 주세요!");
		} else if (airType == "") {
			alert("검색하고자 하는 항공사를 선택하여 주세요!");
		} else {
			airAllClear ();

			loadingHTML = "";
			for(var i = 0; i < 20; i++){
				loadingHTML +=  `
							<ul class='air-schedule-list'>
								<li>
									<img class='list-air-icon beforeCreateLoading' style='height: 14px;' src="../images/blank.gif">
									<span class='beforeCreateLoading' style='width:50px;height:20px;'></span>
									<span class='air_num beforeCreateLoading' style='width:34px;height:18px;'></span>
								</li>
								<li><span class='beforeCreateLoading' style='width:50px;height:20px;'></span></li>
								<li><span class='beforeCreateLoading' style='width:50px;height:20px;'></span></li>
								<li class='warm-color'><span class='beforeCreateLoading' style='width:50px;height:20px;'></span></li>
								<li><span class='beforeCreateLoading' style='width:30px;height:20px;'></span></li>
								<li><span class='beforeCreateLoading' style='width:70px;height:20px;'></span></li>
							</ul>`;
			}

			document.getElementById("depAreaList").innerHTML	= loadingHTML;
			document.getElementById("arrAreaList").innerHTML	= loadingHTML;
			//frmForm.target = "HIDE_ACTION";
			//frmForm.action = "search_start.php";
			//frmForm.submit();
			//const form = document.getElementById('frmForm'); 
			//const formData = new FormData(form);
			const json = await dataSaveSend ('frmForm','/domSearch/domSearch');
			
			success = json.success;
			if (success == "ok") {
				//return json;
				$("#depAreaList").html(json.dep);
				$("#arrAreaList").html(json.arr);
				$("#depCityName").html(json.depName);
				$("#arrCityName").html(json.arrName);
				$("#depDateName").html(json.depName2);
				$("#arrDateName").html(json.arrName2);
			} else {
				console.log("검색2 외부 오류 발생"+json);
			}
		}
		return false;
	}
	function airAllClear() {
		$("#SearchNotice").hide();
		$("#SearchMain").show();
		$("#CalendarLayer").hide();
		$("#end_area").hide();
		$("#start_area").hide();
		$(".seat-layer").hide();
		document.frmForm.depAirCode.value					= "";
		document.frmForm.arrAirCode.value					= "";
		document.getElementById("depAreaList").innerHTML	= "";
		document.getElementById("arrAreaList").innerHTML	= "";
		if (document.getElementById("depAirNameR")) {
			document.getElementById("depAirNameR").innerHTML	= "";
			document.getElementById("depReaminR").innerHTML		= "0";
			document.getElementById("depNameR").innerHTML		= "";
			document.getElementById("depDateR").innerHTML		= "";
			document.getElementById("depAirFlightR").innerHTML	= "";
			document.getElementById("depPriceR").innerHTML		= "";

			document.getElementById("arrAirNameR").innerHTML	= "";
			document.getElementById("arrReaminR").innerHTML		= "0";
			document.getElementById("arrNameR").innerHTML		= "";
			document.getElementById("arrDateR").innerHTML		= "";
			document.getElementById("arrAirFlightR").innerHTML	= "";
			document.getElementById("arrPriceR").innerHTML		= "";

			document.getElementById("adtMemR").innerHTML		= "1";
			document.getElementById("adtPriceR").innerHTML		= "0원";
			document.getElementById("adtAirPriceR").innerHTML	= "0원";
			document.getElementById("adtAirFuelR").innerHTML	= "0원";
			document.getElementById("adtAirTaxR").innerHTML		= "0원";

			document.getElementById("chdMemR").innerHTML		= "0";
			document.getElementById("chdPriceR").innerHTML		= "0원";
			document.getElementById("chdAirPriceR").innerHTML	= "0원";
			document.getElementById("chdAirFuelR").innerHTML	= "0원";
			document.getElementById("chdAirTaxR").innerHTML		= "0원";
			document.getElementById("TotalAmount").innerHTML	= "0원";
		}

	}

	function airSelect (
			pos,air,flight,airName, dep_date,arr_date,dep_code,arr_code,dep_name,arr_name,dep_time,arr_time,flight_time
			,adt,chd,inf,cabin,uid,idx,minor,bookingClass,availSeat,cnt,opCarrierCd
			,adtTax,chdTax,adtFuel,chdFuel) {
		airCode   = air+flight;
		Obj = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		depTime   = CutTime(dep_time.substring(8,12));
		arrTime   = CutTime(arr_time.substring(8,12));
		if (pos == "Dep") {
			posName   = "가는편"; 
			monthName = dep_date.substring(4,2)+"월 " + dep_date.substring(6,2)+"일";
			cityName  = dep_name+"공항";
			name1     = dep_name;
			name2     = arr_name;
			Obj.depAirCode.value   = airCode;
			Obj.depUid.value       = uid;
			Obj.depIdx.value       = idx;
			Obj.depMinor.value     = minor;
			Obj.depTime1.value     = depTime;
			Obj.depTime2.value     = arrTime;
			Obj.depAirClass.value  = bookingClass;
			Obj.depAirName.value   = airName;
			Obj.depCodeShare.value = opCarrierCd;
			
			Obj.adtDepAmt.value    = adt;
			Obj.adtDepTax.value    = adtTax;
			Obj.adtDepFuel.value   = adtFuel;
			Obj.chdDepAmt.value    = chd;
			Obj.chdDepTax.value    = chdTax;
			Obj.chdDepFuel.value   = chdFuel;

			document.getElementById("depAirNameR").innerHTML	= airName;
			document.getElementById("depReaminR").innerHTML		= availSeat;
			document.getElementById("depNameR").innerHTML		= name1 + " -> " + name2;
			document.getElementById("depDateR").innerHTML		= dep_date;
			document.getElementById("depAirFlightR").innerHTML	= air+flight;
			document.getElementById("depPriceR").innerHTML		= commaSplit(adt);
			DepCheck = Obj.DepCheck.value;
			if (DepCheck != "") $("#DepArea_"+DepCheck).removeClass("on_select");
			$("#DepArea_"+cnt).addClass("on_select");
			Obj.DepCheck.value = cnt;
		} else {
			posName   = "오는편";
			monthName = arr_date.substring(4,2)+"월 " + arr_date.substring(6,2)+"일";
			cityName  = arr_name+"공항";
			name1     = dep_name;
			name2     = arr_name;
			Obj.arrAirCode.value   = airCode;
			Obj.arrUid.value       = uid;
			Obj.arrIdx.value       = idx;
			Obj.arrMinor.value     = minor;
			Obj.arrTime1.value     = depTime;
			Obj.arrTime2.value     = arrTime;
			Obj.arrAirClass.value  = bookingClass;
			Obj.arrAirName.value   = airName;
			Obj.arrCodeShare.value = opCarrierCd;

			Obj.adtArrAmt.value    = adt;
			Obj.adtArrTax.value    = adtTax;
			Obj.adtArrFuel.value   = adtFuel;
			Obj.chdArrAmt.value    = chd;
			Obj.chdArrTax.value    = chdTax;
			Obj.chdArrFuel.value   = chdFuel;

			document.getElementById("arrAirNameR").innerHTML	= airName;
			document.getElementById("arrReaminR").innerHTML		= availSeat;
			document.getElementById("arrNameR").innerHTML		= name1 + " -> " + name2;
			document.getElementById("arrDateR").innerHTML		= arr_date;
			document.getElementById("arrAirFlightR").innerHTML	= air+flight;
			document.getElementById("arrPriceR").innerHTML		= commaSplit(adt);
			ArrCheck = Obj.ArrCheck.value;
			if (ArrCheck != "") $("#ArrArea_"+ArrCheck).removeClass("on_select");
			$("#ArrArea_"+cnt).addClass("on_select");
			Obj.ArrCheck.value = cnt;
		}
		if ( (ticket_type == "1" && Obj.depAirCode.value) || (ticket_type == "2" && Obj.depAirCode.value != ""  && Obj.arrAirCode.value != "") ) {
			$("#reserveButton").show();
		}
		$("#revButton").show ();
		$("#ruleButton").show ();
		airPriceConfirm ();
	}
	function airPriceConfirm() {
		Obj      = document.frmForm;
		adtMem   = Number(Obj.adtMem.value);
		chdMem   = Number(Obj.chdMem.value);
		infMem   = Obj.infMem.value;
		tasfDome = (Obj.tasfDome.value) * (adtMem + chdMem);

		adtTot   = (Number(Obj.adtDepAmt.value)  + Number(Obj.adtArrAmt.value))  * adtMem;
		adtTax   = (Number(Obj.adtDepTax.value)  + Number(Obj.adtArrTax.value))  * adtMem;
		adtFuel  = (Number(Obj.adtDepFuel.value) + Number(Obj.adtArrFuel.value)) * adtMem;
		
		if (chdMem > 0) {
			chdTot  = (Number(Obj.chdDepAmt.value)  + Number(Obj.chdArrAmt.value))  * chdMem;
			chdTax  = (Number(Obj.chdDepTax.value)  + Number(Obj.chdArrTax.value))  * chdMem;
			chdFuel = (Number(Obj.chdDepFuel.value) + Number(Obj.chdArrFuel.value)) * chdMem;
		} else {
			chdTot = chdTax = chdFuel = 0;
		}

		adtAmt  = adtTot - adtTax - adtFuel;
		chdAmt  = chdTot - chdTax - chdFuel;

		$("#adtMemR").html(adtMem);
		$("#adtPriceR").html(commaSplit(adtTot)+"원");
		$("#adtAirPriceR").html(commaSplit(adtAmt)+"원");
		$("#adtAirFuelR").html(commaSplit(adtFuel)+"원");
		$("#adtAirTaxR").html(commaSplit(adtTax)+"원");


		$("#chdMemR").html(chdMem);
		$("#chdPriceR").html(commaSplit(chdTot)+"원");
		$("#chdAirPriceR").html(commaSplit(chdAmt)+"원");
		$("#chdAirFuelR").html(commaSplit(chdFuel)+"원");
		$("#chdAirTaxR").html(commaSplit(chdTax)+"원");

		$("#TotalAmount").html(commaSplit(adtTot+chdTot+tasfDome)+"원");

	}
	function tasfChange () {
		airPriceConfirm ();
	}
	function airSelClear (pos) {
		if (pos == "Dep") {
			Obj.depAirCode.value = "";
		} else {
			Obj.arrAirCode.value = "";
		}
		$("#"+pos+"AreaSel").hide();
		$("#"+pos+"Area").show();
		$("#airPriceConfirm").hide();
	}
	function airConfirm () {
		tasfChange();
		Obj = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		depAirCode  = Obj.depAirCode.value;
		arrAirCode  = Obj.arrAirCode.value;
		air1        = depAirCode.substring(0,2);
		air2        = arrAirCode.substring(0,2);
		if (Obj.depAirCode.value == "") {
			alert("출발 항공편을 선택하여 주세요");
		} else if (ticket_type == "2" && Obj.arrAirCode.value == "") {
			alert("리턴 항공편을 선택하여 주세요");
		} else if (ticket_type == "2" && ( air1 == "OZ" || air2 == "OZ") ) {
			alert("아시아나 항공은 항공사 시스템상 편도 예약만 가능합니다. \n\n불편하시더라도 편도로 예약 부탁 드립니다.");
		} else {
//			$(".aq_btn").hide();
			dropLoadStart ("할인 조건을 검색 중입니다.");
			Obj.target = "HIDE_ACTION";
			Obj.action = "../dome/air_book.php";
			//Obj.action = "../dome/discount_check.php";
			Obj.submit();
		}
	}
	function airMemberCheck (g) {
		Obj = document.frmReserve;
		member = Number(Obj.member.value);
		ticket_type = Obj.ticket_type.value;
		Obj.Fake.value = g;
		msg = "";
		exp1 = /([0-9.]){1,}/;
		if (Obj.username1.value == "") msg += "예약자정보 성을 입력하여 주세요\n";
		if (Obj.username2.value == "") msg += "예약자정보 이름을 입력하여 주세요\n";
		if (Obj.handphone.value == "") msg += "예약자정보 휴대전화를 입력하여 주세요\n";
		if (Obj.email.value == "")     msg += "예약자정보 이메일을 입력하여 주세요\n";
		if (Obj.site_name.value == "") msg += "여행사 정보를 입력하여 주세요\n";
		dc = "";
		if (g == "") {
			for (ix = 1 ; ix < member + 1 ; ix ++) {
				name1   = document.getElementById("tName1_"+ix).value;
				name2   = document.getElementById("tName2_"+ix).value;
				dc1     = document.getElementById("tDc1_"+ix).value;
				dc2     = document.getElementById("tDc2_"+ix).value;
				country = document.getElementById("tCountry_"+ix).value;
				sex     = document.getElementById("tSex_"+ix).value;
				birth   = document.getElementById("tBirth_"+ix).value;
				if (name1 == "") msg += ix+"번째 탑승객 성을 입력하여 주세요\n";
				if (name2 == "") msg += ix+"번째 탑승객 이름을 입력하여 주세요\n";
				if (exp1.test(name1) == true) msg += ix+"번째 탑승객 성을 숫자없이 입력해 주세요\n";
				if (exp1.test(name2) == true) msg += ix+"번째 탑승객 이름을 숫자없이 입력해 주세요\n"; // 2022-09-22 추가
				if (sex == "")   msg += ix+"번째 탑승객 성별을 선택하여 주세요\n";
				if (birth == "" || birth.length < 8) msg += ix+"번째 탑승객 생년월일을 8자리로 입력하여 주세요\n";
				if (dc1 == "" ) msg += ix+"번째 탑승객의 가는편 할인조건은 필수 입니다. \n";
				if (dc2 == "" && ticket_type == "2" ) msg += ix+"번째 탑승객의 오는편 할인조건은 필수 입니다. \n";
				if ((dc1 == "" && sex != "MI" && sex != "FI") || (dc2 == "" && ticket_type == "2" )) dc = "Y";
			}
		}
		//dc = "Y"; // 2022-12-25 할인조건은 필수 항목임
		//if (Obj.Agree2.checked == false) msg += "모든 약관에 동의하여 주세요\n";
		//if (Obj.Agree1.checked == false) msg += "개인정보 제3자제공에 동의하여 주세요\n";
		if (dc == "Y") msg += " \n항공사와의 통신이 원할하지 않아 잠시후 다시 시도하시기 바랍니다. ";
		if (msg != "") {
			alert(msg);
		} else {
			var Rc = confirm("현재의 예약을 확정 하시겠습니까?");
			if (Rc) {
				document.getElementById('bookBtn').disabled = true;
				Obj.target = "HIDE_ACTION";
				Obj.method = "post";
				//Obj.action = "air_confirm.html";
				Obj.action = "air_save.php";
				Obj.method = "post";
				Obj.submit();
			}
		}
		return false;
	}
	function copyPax () {
		if (document.frmReserve.samePax.checked == true) {
			name1 = document.frmReserve.username1.value;
			name2 = document.frmReserve.username2.value;
		} else {
			name1 = "";
			name2 = "";
		}
		document.getElementById("tName1_1").value = name1;
		document.getElementById("tName2_1").value = name2;
	}
	function revAction () {
		Obj = document.frmForm;
		if (Obj.chk_agree.checked == false) {
			alert("상기 취소수수료/수하물 규정에 동의하여 주세요!");
		} else {
			Obj.target = "HIDE_ACTION";
			Obj.action = "air_save.php";
			Obj.method = "post";
			Obj.submit();
		}
		return false;
	}
	function airCheck () {
		const query = 'input[name="airLine"]:checked';
		const selectedEls = document.querySelectorAll(query);

		// 선택된 목록에서 value 찾기
		let result = '';
		cnt = 0 ;
		selectedEls.forEach((el) => {
			if (result != "") result += "/";
			result += el.value;
			cnt ++;
		});
		frmForm.airType.value = result;
		if (cnt == 11) document.frmForm.air_ALL.checked = true;
		else document.frmForm.air_ALL.checked = false;
		//return false;
	}
	function airCheckAll () {
		if (document.frmForm.air_ALL.checked == true) {
			chk = true;
		} else {
			chk = false;
		}
		for(i=0; i < frmForm.airLine.length; i++) {
			frmForm.airLine[i].checked = chk;
		}
		airCheck ();
	}
	function paxChange (gu,pos) {
		$("#reserveButton").hide();
		a = Number(document.frmForm.adtMem.value);
		c = Number(document.frmForm.chdMem.value);
		i = Number(document.frmForm.infMem.value);
		mem = a + c + i;
		val = eval("document.frmForm."+gu).value;
		if (pos == "+" && mem == 9) {
			alert("전체 인원이 9명 까지만 예약이 됩니다.");
		} else {
			if (gu == "adtMem") {
				if (pos == "-" && val > 1) {
					val --;
				} else if (pos == "+" && val < 9) {
					val ++;
				}
			} else if (gu == "chdMem") {
				if (pos == "-" && val > 0) {
					val --;
				} else if (pos == "+" && val < 5) {
					val ++;
				}
			} else if (gu == "infMem") {
				if (pos == "-" && val > 0) {
					val --;
				} else if (pos == "+" && val < 5 && i < a) {
					val ++;
				}
			}
			eval("document.frmForm."+gu).value = val;
			document.getElementById(gu+"2").value = val;
		}
		if (document.frmForm.chdMem.value > 0) $("#chdArea").show();
		else $("#chdArea").hide();
		if (document.frmForm.infMem.value > 0) $("#infArea").show();
		else $("#infArea").hide();
		memberSet ();
	}

	function cabinChange (s) {
		Obj   = document.frmForm;
		grade = Obj.grade.value;
		if (grade != s) {
			$("#Seat_"+grade).toggleClass("is-checked");
			Obj.grade.value = s;
			$("#Seat_"+s).toggleClass("is-checked");
		}
		memberSet ();
	}

	function memberSet () {
		Obj   = document.frmForm;
		grade = Obj.grade.value;
		a = document.frmForm.adtMem.value;
		c = document.frmForm.chdMem.value;
		i = document.frmForm.infMem.value;
		data = "성인 "+a;
		if (c > 0) data += ",소아 "+c;
		if (i > 0) data += ",유아 "+i;
		if (grade == "Y") data += ",일반석 ";
		else if (grade == "C") data += ",비지니스석 ";
		else if (grade == "F") data += ",일등석 ";
		document.getElementById("seat-box").value = data;
	}

	function ruleDomeView (air_code,uid,minor) {
		$("#basePopUp").show();
		sFile = "../domList/air_rule_view.php?air_code="+air_code+"&uid="+uid+"&minor="+minor;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}

	function seatView() {
		$(".seat-layer").css("top", "187px");
		$(".seat-layer").css("right", "25px");
		$(".seat-layer").show();		
		$(".city-layer").hide();
		$(".calendar-layer").hide();
	
	}
	function seatClose() {
		$(".seat-layer").hide();
	}
	function popClose () {
//		$(".aq_btn").show();
		$("#revPopup").hide();
	}
	function startOpen() {
		$("#start_area").css("top", "187px");
		$("#start_area").css("left", "29px");
		$("#start_area").toggle();
		airSet (frmForm.depCode.value,frmForm.arrCode.value);
		endClose ();
	}
	function startClose() {
		$("#start_area").hide();
	}
	function endOpen() {
		$("#end_area").css("top", "187px");
		$("#end_area").css("left", "29px");
		$("#end_area").toggle();
		arriveSet (frmForm.depCode.value,frmForm.arrCode.value);
		startClose ();
	}
	function endClose() {
		$("#end_area").hide();
	}
	function memberOpen() {
		$("#personnel_popup").show();
	}
	function memberClose() {
		$("#personnel_popup").hide();
	}
	
	function domRuleView(g) {
		$(".help-pop").show();
		sFile = "air_rule_view.php?air1="+eval("frmForm."+g+"AirCode.value");
		frames["HIDE_ACTION"].location.href = sFile;
	}

	function domRuleHide() {
		$(".help-pop").hide();
	}
	function domeStart(uid,s,minor) {
		members = document.frmReserve.members.value;
		routing = document.frmReserve.routing.value;
		msg = "";

		if (document.all.tename1_1) {
			for (ix = 0 ; ix < members ; ix ++ ) {
				ij = ix + 1;
				sex = eval("document.all.tsex_"+ij).value;
				if (eval("document.all.tename1_"+ij).value == "") msg += ij+ " 번째 영문(성)을 입력하세요\n";
				if (eval("document.all.tbirth_"+ij).value == "")  msg += ij+ " 번째 생년월일을 입력하세요\n";
			}
		}
		for (ix = 0 ; ix < routing ; ix ++ ) {
			ij = ix + 1;
			if (eval("document.frmReserve.aMethod_"+ij).value == "1") method = "cash"; else method = "card";
			if ((eval("document.all.aCardnum1_"+ij).value == "" 
					|| eval("document.all.aCardnum2_"+ij).value == "" 
					|| eval("document.all.aCardnum3_"+ij).value == "" 
					|| eval("document.all.aCardnum4_"+ij).value == "") && method == "card") msg += ij+ " 번째 카드번호를 입력하세요\n";
			if (eval("document.all.aExpiredate1_"+ij).value == ""  && method == "card")     msg += ij+ " 번째 카드 유효기간을 선택하세요\n";
			if (eval("document.all.aExpiredate2_"+ij).value == ""  && method == "card")     msg += ij+ " 번째 카드 유효기간을 선택하세요\n";
			if (trim(eval("document.all.aCardHolder_"+ij).value) == ""  && method == "card")      msg += ij+ " 번째 카드홀더(소유자)를 입력하세요\n";
			if (trim(eval("document.all.aCardPasswd_"+ij).value) == ""  && method == "card")      msg += ij+ " 번째 카드 비밀번호를 입력하세요\n";
			if (trim(eval("document.all.aJumin2_"+ij).value) == ""  && method == "card")          msg += ij+ " 번째 카드 생년월일을 8자리로 입력하세요\n";
		}

		if (document.frmReserve.dep_tel.value == "") msg += " 한국 연락처를 입력하세요\n";
		if (document.frmReserve.email.value == "")   msg += " 이메일 주소를 입력하세요\n";
		
		if (msg != "" ) {
			if (!top.IssueRobot || top.IssueRobot == "") alert(msg);
			else {
				window.open('', '_self', '');
				window.close();
			}
		} else if (s == "5") {
			var Rc = confirm("발권 요청을 하시겠습니까?");
			if (Rc) {
				sFile = "../interline/issue_req.php?uid="+uid;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		} else if (s == "X") {
			var Rc = confirm("발권 요청을 취소 하시겠습니까?");
			if (Rc) {
				sFile = "../interline/issue_req.php?uid="+uid+"&val="+s;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		} else {
			msg = "";
			if (minor > 0) msg = minor+" 번째 여정만 발권 진행합니다.\n\n";
			msg += "자동 발권을 진행합니다.";
			var Rc = confirm(msg);
			if (Rc) {
				dropLoadStart ("발권이 진행중입니다. <br>기다려 주세요!!!");
				sFile = "../domList/issue_start.php?uid="+uid+"&minor="+minor;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		}
		return false;
	}
	aSortChange = [];
	
	function getDomeSorted(s, attrName) {
		code = s+attrName;
		if (!aSortChange[code] || aSortChange[code] == "") {
			aSortChange[code] = "desc";
			order = "asc";
		} else {
			aSortChange[code] = "";
			order = "desc";
		}
		var result = $($("."+s+"Sort").toArray().sort(function(a, b){
			var contentA =parseInt( $(a).data(attrName));
			var contentB =parseInt( $(b).data(attrName));
			if(order == "desc"){
				return (contentA > contentB) ? -1 : (contentA < contentB) ? 1 : 0;
			}else{
				return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
			}
		}));
		$("#"+s.toLowerCase()+"AreaList").append(result);
	}
