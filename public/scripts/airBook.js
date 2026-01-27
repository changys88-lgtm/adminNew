	aDomestic   = new Array("ICN","GMP","PUS","TAE","MWX","CJU","CJJ","YNY");
	currentCity = "2";
	currentTap  = "1";
	currentSub  = 0;
	cityArrayname = ["","departure","arrive","departure2","arrive2"];
	
	aJoinData = new Array ();
	aSegData1 = new Array ();
	aSegData2 = new Array ();
	aSegData3 = new Array ();
	aSegData4 = new Array ();
	aSegData5 = new Array ();
	aSegData6 = new Array ();

	aSelectData = new Array ();

	function cityClose () {
		$("#city_item").hide();
	}
	function cityToggle (s) {
		if (currentTap != s) {
			$("#CityTab_"+currentTap).toggleClass("on");
			$("#CityList_"+currentTap).toggleClass("none");
			currentTap = s;
			$("#CityTab_"+currentTap).toggleClass("on");
			$("#CityList_"+currentTap).toggleClass("none");
		}
	}
	function typeChange(s) {
		const Obj = document.frmForm;
		let ticket_type = Obj.ticket_type.value;
		if (ticket_type != s) {
			$("#ticketType"+ticket_type).toggleClass("active");
			ticket_type = s;
			Obj.ticket_type.value = ticket_type;
			$("#ticketType"+ticket_type).toggleClass("active");
			if (ticket_type == "1") {
				$("#openCalendarReturn").hide();
				$("#singleArea").show();
				$("#multiArea").hide();
				$("#multiSelect").hide();
				$("#sotoSelect").show();
				$("#itiRouteRight2").hide();
				Obj.RouteCount.value = 1;
				multiAllHide ();
			} else if (ticket_type == "2") {
				$("#openCalendarReturn").show();
				$("#singleArea").show();
				$("#multiArea").hide();
				$("#multiSelect").hide();
				$("#sotoSelect").show();
				$("#itiRouteRight2").show();
				Obj.RouteCount.value = 2;
				multiAllHide ();
			} else if (ticket_type == "3") {
				$("#singleArea").hide();
				$("#multiArea").show();
				$("#multiSelect").show();
				$("#sotoSelect").hide();
				Obj.RouteCount.value = 2;
				multiAllView ();
			}
		} else if (s == "3") {
			RouteCount = Number(Obj.RouteCount.value);
			for (ix = 2;  ix < RouteCount+1 ; ix ++) {
				$("#Route_"+ix).toggle();
			}
		}
		$(".city-layer").removeClass("is-open");
		return false;
	}
	function multiAllView () {
		RouteCount = Number(document.frmForm.RouteCount.value);
		for (ix = 2;  ix < 5 ; ix ++) {
			if (ix <= RouteCount) {
				$("#Route_"+ix).show();
				$("#itiRoute_"+ix).show();
				$("#itiRouteRight"+ix).show();
			} else {
				// $("#Route_"+ix).hide();
				$("#itiRoute_"+ix).hide();
				$("#itiRouteRight"+ix).hide();
			}
		}
	}
	function multiAllHide () {
		for (ix = 3;  ix < 7 ; ix ++) {
			$("#itiRoute_"+ix).hide();
			// $("#Route_"+ix).hide();
		}
	}
	function addRouting (g) {
		Obj = document.frmForm;
		RouteCount = Obj.RouteCount.value;
		if (RouteCount < 4 && g == "+") {
			RouteCount ++;
			Obj.RouteCount.value = RouteCount;
			html = `
				<div class="additional-Area" id="Route_${RouteCount}">
					<div class="item-1">
						<div class="tr-item city-toggle">
							<p class="t1">출발도시</p>
							<span class="input-con">
								<input type="text" class="city-input" name="dep_city${RouteCount}_name" id="dep_city${RouteCount}_name" onClick="cityView(1,${RouteCount})" onkeyup="autoComplete(this,1,${RouteCount})" autocomplete="off" value="" placeholder="출발도시">
							</span>
						</div>
						<div class="tr-swap">
							<a href="#"><img src="../images/ico_swap-w.png"></a>
						</div>
						<div class="tr-item city-toggle">
							<p class="t1">도착도시</p>
							<span class="input-con">
								<input type="text" class="city-input" name="arr_city${RouteCount}_name" id="arr_city${RouteCount}_name" onClick="cityView(2,${RouteCount})" onkeyup="autoComplete(this,2,${RouteCount})" autocomplete="off" placeholder="도착도시">
							</span>
						</div>
					</div>
					<div class="item-2">
						<div class="tr-item ">
							<div class="tr-item tr-item-seat" >
								<li class="date-span">
									<input type="checkbox" id="cabinCheck${RouteCount}_" onchange="modalTabClear ('cabinCheck${RouteCount}_')">
										<label class="sort" for="cabinCheck${RouteCount}_">
										<span id="cabinName${RouteCount}_"> 이코노미 </span>
										</label>
									<div>
										<div class="Real_sort">
											<section id="Real${RouteCount}${RouteCount}">
												<ul class="tourtypes">
													<li class="tourtype_name"><label onclick="return cabinChangeSingle('${RouteCount}','Y')">이코노미</label></li>
													<li class="tourtype_name"><label onclick="return cabinChangeSingle('${RouteCount}','P')">이코노미 프리미엄</label></li>
													<li class="tourtype_name"><label onclick="return cabinChangeSingle('${RouteCount}','C')">비즈니스</label></li>
													<li class="tourtype_name"><label onclick="return cabinChangeSingle('${RouteCount}','F')">퍼스트</label></li>
												</ul>
											</section>
										</div>
									</div>
									<label for="cabinCheck${RouteCount}_"></label>
								</li>
							</div>
							<p class="t1">가는날</p>
							<span class="date-span" id="dep_date${RouteCount}_name" onClick="return CalendarInterBasic('dep_date${RouteCount}','frmForm','CalendarLayer','','','','')">
								선택하세요
							</span>
						</div>
					</div>
				</div>
			`;
			//$("#multi_area").append(html);
			$(".multi-area-box").append(html);
		} else if (RouteCount > 2 && g == "-") {
			$("#Route_"+RouteCount).remove();
			RouteCount --;
			Obj.RouteCount.value = RouteCount;
		}
		multiAllView ();
	}
	function keyCheck(Obj) {
		var isPass = /^[A-Z]$/;
		city = Obj.value;
		city = city.toUpperCase();
		Obj.value = city;
		name = Obj.name;
		fChr = city.substring(0,1);
		if (isPass.test(fChr) == true) {
			if (city.length == 3) {
				//if (!aAirName[city]) {
				//	alert('운항이 안되는 지역입니다.');
				//	return false;
				//} else if (name == "arrive") {
					if (frmFormInter.ticket_type.value == "2") frmFormInter.departure2.focus();
				//}
			}
		} else {
			// 한글 작업 부분
			//for (ix = 0 ; ix < aAirName.length ; ix ++) {
			//	alert(aAirName)
			//}
		}
		if (aAirName[city]) {
			if (name == "depature") s = "1";
			else if (name == "arrive") s = "2";
			else if (name == "departure2") s = "3";
			else if (name == "arrive2") s = "4";
			curPosition = s;
			menuHide();
			if (s == "1")  depaChange(city);
			else if (s == "2") arrChange(city);
			else if (s == "3") depaChange2(city);
			else if (s == "4") arrChange2(city);
		}
	}
	function cityView (pos,g) {
//		n = document.getElementById("calendar_box").style.display;
//		if (n == "none") $("#city_item").css("padding-top","20px");
//		$("#departure_"+currentCity).toggleClass("borderRed");
//		currentCity = pos ;
//		$("#departure_"+currentCity).toggleClass("borderRed");
//		$("#city_item").show();
//		$("#MonthData").hide();
		//aDomestic
		Obj = document.frmForm;
		// form이 로드될 때까지 재시도 (최대 500ms)
		let retryCount = 0;
		const checkForm = () => {
			if (!Obj || !Obj.ticket_type) {
				retryCount++;
				if (retryCount < 10) {
					setTimeout(checkForm, 50);
					return;
				}
				// form이 없어도 레이어는 표시 (form이 로드되지 않아도 도시 선택은 가능해야 함)
				console.log("cityView: form not ready, showing layer anyway");
			} else {
				ticket_type = Obj.ticket_type.value;
				departure   = Obj.departure.value;
				dep_city1   = Obj.dep_city1 ? Obj.dep_city1.value : '';
				currentCity = pos ;
				currentSub  = g ;
				if (ticket_type == "2" && pos == "2" && g == "0" && inArray(departure,aDomestic) == true) {
					$(".국내").hide();
				} else if (ticket_type == "3" && pos == "2" && g == "1" && inArray(dep_city1,aDomestic) == true) {
					$(".국내").hide();
				} else {
					$(".국내").show();
				}
			}
			interSearchClose();
			$("#CityLayer").css("top", "167px");
			$("#CityLayer").css("left", "14px");
			//$("#CityLayer").css("display", "block");
			$(".city-layer").addClass("is-open");
			//$(".calendar-layer").removeClass("is-open");
			//$(".calendar-layer").css("display", "none");
			//$(".seat-layer").removeClass("is-open");
			//$(".seat-layer").css("display", "none");
			
			// 달력 레이어가 닫혔으므로 전체 페이지 스크롤 비활성화
			$("main.international").removeClass("has-calendar-open");
		};
		checkForm();
	}
	function seatView() {
		interSearchClose();
		$(".seat-layer").css("top", "167px");
		$(".seat-layer").css("right", "25px");
		$(".seat-layer").show();
		//$(".seat-layer").addClass("is-open");
		//$(".city-layer").removeClass("is-open");
		//$(".calendar-layer").removeClass("is-open");
		//$(".calendar-layer").css("display", "none");
		
		// 달력 레이어가 닫혔으므로 전체 페이지 스크롤 비활성화
		$("main.international").removeClass("has-calendar-open");
	}
	function seatClose() {
		$(".seat-layer").hide();
	}
	function cityChoice (code,name,name_en) {
		Obj = document.frmForm;
		let RouteCount  = Obj.RouteCount.value;
		let ticket_type = Obj.ticket_type.value;
		if (currentSub > 0) {
			if (currentCity == "1") idname = "dep"; else idname = "arr";
			idname += "_city"+currentSub;
		} else {
			idname = cityArrayname[currentCity];
		}

		eval("document.frmForm."+idname).value = code;
		document.getElementById(idname+"_name").value = name;
		if (currentCity == "2" && currentSub == "0") {
			eval("document.frmForm."+idname).value = code;
		}
		if (currentSub > 0 && RouteCount > currentSub && currentCity == "2") {
			eval("document.frmForm.dep_city"+(currentSub+1)).value = code;
			document.getElementById("dep_city"+(currentSub+1)+"_name").value = name;
		}
		if ((currentSub == 1 || currentSub == 0) && currentCity == "2") {
			//sFile = "air_like_check.php?code="+code;
			//frames["HIDE_ACTION"].location.href = sFile;
			airLikeCheck (code);
		}
		//$("#CitySearchBox").fadeOut();
		$(".city-layer").removeClass("is-open");
		topStatus = false;
		// 도시를 연속으로 체크할수 있게 변경 2021-11-15
		if (ticket_type == "3" && RouteCount > currentSub) {
			cityView(currentCity,Number(currentSub) + 1);
		}
		//interSearchCheck();
	}
	function interSearchCheck () {
		Obj = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		departure   = Obj.departure.value;
		arrive      = Obj.arrive.value;
		
		//aDomestic

		departure_date = Obj.departure_date.value;
		arrive_date    = Obj.arrive_date.value;
		if (ticket_type == "1" && departure != "" && arrive != "" && departure_date != "") interSearch  ();
		else if (ticket_type == "2" && departure != "" && arrive != "" && departure_date != "" && arrive_date != "") interSearch  ();
	}


	// function loadStartCircle (str) {
	// 	rs = "\
	// 		<div class='loading_form_wrap_circle'>\
	// 			<div class='loading_img'>\
	// 				<img src='../images/airplaneforloading.png' alt='' class='airplane_load'>\
	// 				<img src='../images/shadowforloading.png' alt='' class='shadow_load'>\
	// 			</div>\
	// 			<div class='loading_text'>\
	// 				<p>"+str+"</p>\
	// 			</div>\
	// 		</div>\
	// 	";
	// 	return rs;
	// }
	
	async function monthSearch () {
		Obj = document.frmForm;
		if (Obj.departure.value == "") {
			alert("출발도시를 선택하세요");
		} else if (Obj.arrive.value == "") {
			alert("도착도시를 선택하세요");
		} else {
			LoadingStart ();
			$("#FilterArea").hide();
			$("#SearchNotice").hide();
			$("#MonthData").show();
			$("#DepartureArea").hide();
			$("#ArriveArea").hide();
			$("#SearchSub").hide();
			$("#reSearchButton").hide();
			$("#revButton").hide();
			$("#ruleButton").hide();
			typeChange('1');
			//whiteLoadStart("월별 조회중!!");
//			document.getElementById("DepartureArea").innerHTML = "";
//			document.getElementById("ArriveArea").innerHTML = "";
			//Obj.target = "HIDE_ACTION";
			//Obj.action = "../interV2/month_search.php";
			//Obj.submit();
			json     = await dataSaveSend('frmForm','/interSearch/monthSearch');
			success  = json.success;
			errorMsg = json.errorMsg;
			if (success === 'ok') {
				$("#MonthData").html(json.data);
			} else {
				newAlert("에러"+errorMsg);
			}
			LoadingStop();
		}
		return false;
	}


	function monthNext (date,date_) {
		document.frmForm.departure_date.value = date;
		document.getElementById("departure_date_name").innerHTML = date_;
		monthSearch ();
	}
	function monthData (date,air,src,dest,pr,bc,DepartureTime,ArrivalTime,air2,src2,dest2,DepartureTime2,ArrivalTime2,date_) {
		if (monthActive != "") $("#Detail_"+monthActive).hide();
		monthActive = date;
		airActive   = air;
		$("#Detail_"+monthActive).show();
		pr = commaSplit(pr);
		addCity = ""
		addAir  = ""
		if (src2 != "") addCity = "<br>"+src2 + " → "+dest2;
		if (air2 != "") addAir  = "<br>"+air2 + " " + DepartureTime2 + " → " + ArrivalTime2 ;
		document.getElementById("Detail_"+date).innerHTML = `
			<p>${src} → ${dest} <br>${air} ${DepartureTime} → ${ArrivalTime} ${addCity} ${addAir}<br>${pr}원 ${bc}석</p>
			<p class='btn_basic btn_blue' onClick=\"interSearch2('${date}','${date_}','${air}','${air2}')\">예약하기</p>
			<svg width='12px' height='10.3px' viewBox='0 0 11.3 9.5'>
				<path d='M10.8,0.2l-5.2,9l-5.2-9'/>
			</svg>
		`;
	}
	function interSearch2 (date,date_,air,air2) {
		document.frmForm.departure_date.value = CutDate(date);
		document.frmForm.beforeAir.value      = air;
		document.frmForm.beforeAir2.value     = air2;
		if (document.getElementById("departure_date_name")) document.getElementById("departure_date_name").innerHTML = date_;
		if (document.getElementById("airDateName1")) document.getElementById("airDateName1").innerHTML = date_;
		if (document.frmForm.departure_date_name) document.frmForm.departure_date_name.value = date_;
		document.frmForm.stopover.checked = true;
		interSearch ();
	}
	async function interSearch () {
		Obj = document.frmForm;
//		sFile = "../inter/book_confirm.php";
//		frames["HIDE_ACTION"].location.href = sFile;
//		return;
		ticket_type			= Obj.ticket_type.value;
		RouteCount			= Number(Obj.RouteCount.value);
		departure_date		= Obj.departure_date.value;
		arrive_date			= Obj.arrive_date.value;
		departure			= Obj.departure.value;
		arrive				= Obj.arrive.value;
		dep_city1			= Obj.dep_city1.value;
		arr_city1			= Obj.arr_city1.value;
		adt					= Obj.adt.value;
		chd					= Obj.chd.value;
		inf					= Obj.inf.value;
		Search = false;


		if(ticket_type == 1 ){
			$('.preNextButton_2').hide();
			
		}

		if (inArray (departure,aDomestic) == true && inArray (arrive,aDomestic) == true) {
			alert("국내선 검색은 지원되지 않습니다.");
			return false;
		}
		if (ticket_type == "3") {
			msg = "";
			for (ix = 1;  ix < RouteCount+1 ; ix ++) {
				if (eval("document.frmForm.dep_city"+ix).value == "") msg += ix + "번째 출발 도시를 선택하세요 \n";
				if (eval("document.frmForm.arr_city"+ix).value == "") msg += ix + "번째 도착 도시를 선택하세요 \n";
				if (eval("document.frmForm.dep_date"+ix).value == "") msg += ix + "번째 출발 날짜를 선택하세요 \n";
			}
			if (msg != "") {
				alert(msg);
				return false ;
			} else {
				Search = true;
			}
		} else {
			if (Obj.departure.value == "") {
				alert("출발도시를 선택하세요");
			} else if (Obj.arrive.value == "") {
				alert("도착도시를 선택하세요");
			} else if (Obj.arrive.value == Obj.departure.value) {
				alert("출발과 도착도시가 같습니다.");
			//} else if (Obj.departure2.value == "" && ticket_type == "2") {
			//	alert("리턴 도착도시를 선택하세요");
			//} else if (Obj.arrive.value == "" && ticket_type == "2") {
			//	alert("리턴 도착도시를 선택하세요");
			} else if (departure_date == "") {
				alert("출발일자를 선택하세요");
			} else if (adt < inf) {
				alert("성인과 같은 인원수의 유아만 동반이 가능합니다.")
			} else if (departure_date > arrive_date  && ticket_type == "2") {
				//alert("검색하시는 날짜를 바르게 선택하세요");
				// 2021-03-02 요청에 의해 수정
				var Rc = confirm("편도 항공권으로 조회 하시겠습니까?");	
				if (Rc) {
					typeChange (1);
					interSearch ();
				}
			} else {
				Search = true;
			}
		}
		if (Search == true) {
//			if (ticket_type == "1") {
//				document.getElementById("DepartureArea").className = "info_box_ow mr15";
//				$("#ArriveArea").hide();
//			} else {
				//document.getElementById("DepartureArea").className = "info_box mr15";
				//$("#ArriveArea").show();
			//}
			$("#reSearchButton").hide ();
			$("#revButton").hide ();
			$("#ruleButton").hide ();
			interSearchClose();
			//$(".calendar-layer").removeClass("is-open");
			//$(".city-layer").removeClass("is-open");
			//$(".seat-layer").removeClass("is-open");
			//$("#SearchShare").hide();
			//$("#SearchAir").hide();
			//$("#SearchDepartureTime").hide();
			//$("#SearchArriveTime").hide();
			//$("#SearchShareTime").hide();
			//$("#SearchPriceGubun").hide();
			//$("#SearchPrice").hide();
			//$("#MonthData").hide();
			//$("#detail_option").hide();
			$("#FilterArea").show();

			//$("#ReserveArea").hide();
			//$("#MonthData").hide();
			$("#DepartureArea").show();
			$("#ArriveArea").show();
			//$("#FilterArea").show();
			$("#SearchSub").show();
			
			$("#SearchNotice").hide();
			if (document.frmForm.totalAir.value) {
				searchShareChange (0);
				searchAirChange('');
				searchDepTimeChange('');
				searchArrTimeChange('');
				searchShareTimeChange('');
				searchPriceChange(0);
			}
			if (ticket_type == "3") {
				// 2024-04-24 고정형으로 변경
				//for (ix = 2;  ix < RouteCount+1 ; ix ++) {
					// $("#Route_"+ix).hide();
				//}
			}
			// 상단탭의 이름 바꿈
			//console.log(searchFrameNumber);
			if (ticket_type == "3") {
				departure = dep_city1;
				arrive    = arr_city1;
			}
			parent.$("#searchTop_"+searchFrameNumber).html(departure + "→" +arrive);

			//searchFrameNumber;
			revLimitTime = 300;
			//if (revTime) revTimeCheckClear ();
			if (chd > 0) $("#chdArea").show (); else $("#chdArea").hide ();
			if (inf > 0) $("#infArea").show (); else $("#infArea").hide ();
			airAllClear ();
			aSelectData.length = 0; // 선택된 데이터 초기화 2024-04-24 
			$("#airListArea1").html(shadowLoadStart());
			$("#airListArea2").html(shadowLoadStart());
			
			json    = await interPostSend ('airSearch');
			id      = json.id;
			success = json.success;
			if (success == "ok") {
				searchView (id);
			} else {
				console.log("검색3 외부 오류 발생"+json);
			}
		}
		return false;
	}
	function beforeSearchShow () {
		interSearchClose();
		$("#beforeSearch").show();
	}
	function ageCheckShow () {
		interSearchClose();
		$("#ageCheckPopup").show();
	}
	function interSearchClose () {
		$(".calendar-layer").removeClass("is-open");
		$(".city-layer").removeClass("is-open");
		$(".seat-layer").hide();
		$("#SearchShare").hide();
		$("#SearchAir").hide();
		$("#SearchDepartureTime").hide();
		$("#SearchArriveTime").hide();
		$("#SearchShareTime").hide();
		$("#SearchPriceGubun").hide();
		$("#SearchPrice").hide();
		$("#codeShareView").hide();
		$("#MonthData").hide();
		$("#beforeSearch").hide();
		$("#ageCheckPopup").hide();
		$("#SearchHistory").hide();
	}

	async function interPostSend(file='') {
		json = await dataSaveSend ('frmForm',`/interSearch/${file}`);
		success = json.success;
		if (success == "ok") {
			return json;
		} else {
			console.log("검색2 외부 오류 발생"+json);
		}
	}

	async function searchView(id) {
		frmForm.maxUid.value = id;
		json    = await interPostSend ('airSearchView');
		data    = json.datas;
		success = json.success;
		if (success === "ok") {
			searchLikeView (data);
		} else {
			console.log("검색1 외부 오류 발생"+json);
		}
	}

	async function pnrCreate (uid,mode='') {
		if (mode === "Save") var Rc = true;
		else var Rc = confirm ('PNR 생성을 시작합니다.');
		if (Rc) {
			//$("#revPopup").show();
			dropLoadStart ("PNR 생성중입니다.");
			frmForm.uid.value = uid;
			json     = await interPostSend ('pnrCreate');
			success  = json.success;
			pnr      = json.pnr;
			errorMsg = json.errorMsg;
			if (success === "ok" && !errorMsg) {
				smallPopHide();
				//pnrCheck (uid);
				//console.log(json)
				if (mode === "Save") {
					$('#revPopup').hide();
					frameChange('INTERLIST', '/air/order_list', '국제선예약목록');
				}
			} else if (errorMsg) {
				smallPopHide();
				newAlert(errorMsg,'reload');
			} else {
				console.log("PNR생성중 외부 오류 발생"+json);
			}
		}
		return false;
	}

	async function pnrCheck (uid,mode='') {
		if (mode === "List") alert("PNR 체크를 시작합니다.");
		//$("#revPopup").show();
		dropLoadStart ("PNR 확인중입니다.");
		frmForm.uid.value  = uid;
		frmForm.mode.value = mode;
		json    = await interPostSend ('pnrCheck');
		data    = json.datas;
		success = json.success;
		if (success === "ok") {
			smallPopHide();
			console.log(json);
			if (mode === "List" || mode === "reCheck") formSearch();
		} else {
			console.log("PNR생성중 외부 오류 발생"+json);
		}
	}

	function searchLikeView (arrData) {
		Obj = document.frmForm;
		Count = Number(Obj.RouteCount.value);
		if (Count === 1) Count = 2;
		for (ix = 1 ; ix <= Count ; ix ++) {
			$("#airListArea"+ix).html(arrData["startAir"][ix]);  
		}
		$("#SearchAir").html(arrData["airData"]);
		aJoinData = arrData["joinScript"];
		aSegData1 = arrData["segData"][1];
		aSegData2 = arrData["segData"][2];
		aSegData3 = arrData["segData"][3];
		aSegData4 = arrData["segData"][4];
		$("#CacheIgnore").prop("checked", false);
		monthFirstClick = arrData["monthFirstClick"];
		searchPriceChange(1);
		if (monthFirstClick) {
			$("#"+monthFirstClick).click();
			$("#revButton").click();
		}

	}

	async function siteInterCheck(s,val) {
		const body = new URLSearchParams({ mode: s, code: val }); // 자동 인코딩
		if (s === "site") $("#SiteSearch").show();
		try {
			const res  = await fetch(`/interSearch/siteCheck`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      			body
			});
			const json  = await res.json();
			success = json.success;
			if (success == "ok") {
				if (s === "site") {
					$("#SiteSearch").html(json.datas);
				} else if (s === "manager") {
					$("#siteManager").html(json.datas);
				}
			} else {
				console.log("검색2 외부 오류 발생"+json);
			}
		} catch (err) {
			console.log("검색시 내부 오류 발생 " + err)
		}
	}
	function siteInterInsert (code,name) {
		eval("document.frmReserve.site_code").value  = code;
		eval("document.frmReserve.site_name").value = name;
		siteInterCheck ("manager",code);
		$("#SiteSearch").hide();
	}
	function dateChange (s,date) {
		eval("document.frmForm."+s).value = date;
		interSearch ();
	}
	function viewAction () {	
		Obj = document.frmForm;
		Obj.target = "HIDE_ACTION";
		Obj.action = "air_search_view.php";
		Obj.submit();
	}

	function airAllClear() {
		ticket_type = document.frmForm.ticket_type.value;
		RouteCount  = Number(document.frmForm.RouteCount.value);
		for (routeCnt = 1 ; routeCnt < 5 ; routeCnt ++ ) {
			if (routeCnt > 1) {
				depCheck_ = eval("document.frmForm.depCheck"+routeCnt).value;
				$("#Departure"+routeCnt+"_"+depCheck_).removeClass("on_select");
				$(".item-innn_"+routeCnt).removeClass("on_select");
			}
			if (routeCnt > 2) {
				$(".item-innn_"+routeCnt).removeClass("on_select");
				if (ticket_type == "3" && RouteCount >= routeCnt) {
					$("#itiRouteRight"+routeCnt).show();
					$("#itiRoute_"+routeCnt).show();
					//$("#itiRoute"+routeCnt).width("695px");
				} else {
					$("#itiRouteRight"+routeCnt).hide();
					$("#itiRoute_"+routeCnt).hide();
					//$("#itiRoute"+routeCnt).width("0px");
				}
			}
		}
		// $(".sub_menu").hide();
		for (routeCnt = 1 ; routeCnt < 9 ; routeCnt ++ ) {
			eval("document.frmForm.airCode"+routeCnt).value             = "";
			eval("document.frmForm.depCity"+routeCnt).value             = "";
			eval("document.frmForm.arrCity"+routeCnt).value             = "";
		}
		for (routeCnt = 1 ; routeCnt < 5 ; routeCnt ++ ) {
			if (routeCnt > 1) eval("document.frmForm.depCheck"+routeCnt).value            = "";
			eval("document.frmForm.airPrice"+routeCnt).value            = "";
			eval("document.frmForm.Child"+routeCnt).value               = "0";
			eval("document.frmForm.Infant"+routeCnt).value              = "0";
		}

	}

	function BrandChange (data) {
		Obj    = document.frmReserve;
		tmp    = data.split("//");
		key    = tmp[0];
		price  = tmp[1];
		cls    = tmp[2];
		cabin  = tmp[3];
		fare   = tmp[4];
		brand  = tmp[6];
		Obj.brandType.value = brand;
		if (key == 0) {
			fare = "//////";
		}
		aPrice = price.split("/");
		price1 = Number(aPrice[0]);
		price2 = Number(aPrice[1]);
		price3 = Number(aPrice[2]);
		aCls   = cls.split("/");
		aCabin = cabin.split("/");
		aFare  = fare.split("/");
		aBrand = brand.split("/");
		fLen   = aFare.length;
		cLen   = aCls.length;
		for (ix = 0 ; ix < cLen ; ix ++) {
			ii = ix + 1;
			eval("document.frmReserve.airClass"+ii).value  = aCls[ix];
			eval("document.frmReserve.Farebasis"+ii).value = aFare[ix];
			eval("document.frmReserve.BrandTier"+ii).value = aBrand[ix];
		}
		adult_tax     = Number(Obj.adult_tax.value);
		child_tax     = Number(Obj.child_tax.value);
		infant_tax    = Number(Obj.infant_tax.value);
		price1 = price1 - adult_tax;
		price2 = price2 - child_tax;
		price3 = price3 - infant_tax;
		Obj.adult_price.value = price1;
		Obj.child_price.value = price2;
		Obj.infant_price.value = price3;
		adt           = Obj.adt.value;
		chd           = Obj.chd.value;
		inf           = Obj.inf.value;
		issueComm     = Number(Obj.issueComm.value);
		issueCommSite = Number(Obj.issueCommSite.value);
		adult_price   = Number(Obj.adult_price.value);
		child_price   = Number(Obj.child_price.value);
		infant_price  = Number(Obj.infant_price.value);
		tp  = ((price1+adult_tax) * adt) + ((price2+child_tax) * chd) + ((price3+infant_tax) * inf);
		iss = (issueComm * adt) + (issueComm * chd);
		//tp2 = tp + (adult_tax * adt) + (child_tax * chd) + (infant_tax * inf) ;
		Obj.TotalPrice.value = tp;
		iss2   = ( issueCommSite * adt ) + ( issueCommSite * chd) ;

		//document.getElementById("adtPriceR").innerHTML			= commaSplit(price1+adult_tax+issueComm)+"원";
		//document.getElementById("adtAirPriceR").innerHTML		= commaSplit(price1+issueComm)+"원";
		//document.getElementById("chdPriceR").innerHTML			= commaSplit(price2+child_tax+issueComm)+"원";
		//document.getElementById("chdAirPriceR").innerHTML		= commaSplit(price2+issueComm)+"원";
		//document.getElementById("infPriceR").innerHTML			= commaSplit(price3+infant_tax)+"원";
		//document.getElementById("infAirPriceR").innerHTML		= commaSplit(price3)+"원";
		document.getElementById("finalTotalAmount").innerHTML	= commaSplit(tp+iss+iss2)+"원";
		//document.getElementById("TotalAmount").innerHTML		= commaSplit(tp+iss+iss2)+"원";
		document.getElementById("finalAdtAmount").innerHTML		= commaSplit(((price1+adult_tax)*adt)+issueComm)+"원";
		document.getElementById("finalChdAmount").innerHTML		= commaSplit(((price2+child_tax)*chd)+issueComm)+"원";
		document.getElementById("finalInfAmount").innerHTML		= commaSplit((price3+infant_tax)*inf)+"원";
		return true;
	}

	function arrayCompCheck(str1,str2) {
		arr1 = str1.split("-v-");
		arr2 = str2.split("-v-");
		chk = 0;
		for (ix = 0 ; ix < arr1.length ; ix ++) {
			if (arr2.indexOf(arr1[ix]) != -1) {
				chk = 1;
				break;
			}
		}
		return chk ;
	}

	function airLinkView (joinKey,num) {
		$(".a-list-item").removeClass("link_select");
		idname = "Departure";
		for (routeCnt = 1; routeCnt < 5 ; routeCnt ++ ){ 
			if (routeCnt != num) {
				arrCnt = 0 ;
				offset = "";
				ids = idname + routeCnt + "_";
				while (document.getElementById(ids+arrCnt)) {
					val = document.getElementById("depValue"+routeCnt+"_"+arrCnt).value;
					arrTmp = Explode("^",val);
					//console.log(joinKey + "   " + arrTmp[16]);
					//if (arrTmp[16] == aJoinDataKey) {
					if (arrayCompCheck(arrTmp[16],joinKey) == 1) { // 2024-03-28 변경
						$("#"+ids+arrCnt).fadeIn();
						if (offset == "") offset = ids+ arrCnt ; // $("#"+ids+arrCnt).offset().top;
						$("#"+ids+arrCnt).addClass("link_select");
						$("#"+ids+arrCnt).removeClass("link_none");
						$("#DepartureBox"+routeCnt+"_"+arrCnt).removeClass ("link_nodrop");
						// Seg_2_0
						// $("#Seg"+routeCnt+"_"+arrCnt).html("+1,000원");
					}
					else $("#"+ids+arrCnt).hide();
					arrCnt ++;
				}
				if (offset != "") pageJump ( offset ,  routeCnt);
			}
		}
	}

	function pageJump (id , routeCnt) {
		setTimeout(function() { 
			move = $("#"+id).position().top - 30;
			nowScroll = $("#airListForm"+routeCnt).scrollTop();
			$('#airListForm'+routeCnt).animate({ 
				scrollTop: nowScroll + move
			}, 500);
		},100);
	} 

	function secondChoice (m,c,s,airData) {
		$(".item-innn_"+m).removeClass("on_select");
		$("#DepBoxOutline_"+m+"_"+c+"_"+s).addClass("on_select");
		//return false;
		arrayInfo = Explode("^",airData);
		arrayAir  = Explode("|",arrayInfo[1]);
		arrayCls  = Explode("|",arrayInfo[2]);
		arrayTime = Explode("|",arrayInfo[9]);
		shareData = arrayInfo[23].split("|")[2].split(",");
		$("#ShareTime_"+m+"_"+c).html(shareData[7]);
		$("#DelayTime_"+m+"_"+c).html(shareData[6]);
		airChoice (airData,"stop");
	}

	function airChoice(s,stop) {
		//																																	 발권일기준                                     사전발권  출발항공편  리턴시출발항공귀속
		//  0             1      2      3      4     5      6    7     8       9       10      11       12     13        14              15      16         17          18         19         20           21          22      23         24
		//ViewPosition/airCode/class/StartTm/EndTm/FltTm/Equip/price/Expire/rule_uid/Combi/StartAirp/EndAirp/bView/bsp_yesno -> farekey/seat/joinCode/issue_term/ChildPrice/NormalPrice/PreIssue/flt_number/stAir_cascade/issue_comm/SelRadio
		tmp = Explode("^",s);
		//parent.frmFormInter.lastAction.value = s;
		Obj = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		RouteCount  = Number(Obj.RouteCount.value);
//		open_ticket = Obj.open_ticket.value;
		price       = 0;
		airCode2    = "";
		air1        = "";
		addCityCode = "";
		//console.log(tmp);
		mem1 = Obj.adt.value;
		mem2 = Obj.chd.value;
		mem3 = Obj.inf.value;

		aChild    = Explode("|",tmp[18]);
		inf_gubun = aChild[1];

		aCode  = Explode("|",tmp[1]);
		aClass = Explode("|",tmp[2]);

		aKey   = Explode("|",tmp[9]);
		aPrice = Explode("|",tmp[7]);

		dTime   = Explode("|",tmp[3]);
		aTime   = Explode("|",tmp[4]);

		dCity   = Explode("|",tmp[11]);
		aCity   = Explode("|",tmp[12]);

		aEquip  = Explode("|",tmp[6]);
		aFlt    = Explode("|",tmp[5]);

		aInfo   = Explode("|",tmp[23]);
		aInfos  = Explode(",",aInfo[2]); // 기타 정보 전달

		aTax		= Explode("|",tmp[19]);
		tax1		= aTax[0];
		tax2		= aTax[1];
		tax3		= aTax[2];
		tax4		= aTax[3];
		distance1	= aTax[4];
		distance2	= aTax[5];


		//Minor   = Number(tmp[0]);
		if (tmp[0] == "1") Minor = 1;
		else {
			Minor = Number(eval("document.frmForm.tripKey"+tmp[0]).value);
		}
		//'1^HA460|^ H|^2125|2022-03-14T21:25:00.000+09:00^1040|2022-03-14T10:40:00.000-10:00^495|^332|^1085000|10000|0^^52n3S8YynDKAdEy7/LAAAA==|52n3S8YynDKANDy7/LAAAA==|||0^ | ^ICN|^HNL|HNL^Y^    ^7 ^52n3S8YynDKAhIy7/LAAAA==^  ^  ^211000||^  ^  ^  ^10000|^29')" id="Departure1_29">							<ul>															<li class="n1"><span><img src="../images/airline/HA.png" class="air-logo"> HA460</span> 하와이안 에어라인  </li>								<li class="t1 virtual"><span>ICN</span><span class="bold">21:25</span></li>								<li class="t1"><span>HNL</span><span class="bold">10:40</span></li>								<li class="t2"><span>8시간 15분 소요</span><span class="baggage-t"> </span></li>								<li class="p1"><span class="price">1,296,000원</span></li>								<img src="../images/arrow5.png" class="detail-ico motion list_click" onclick="event.cancelBubble=true;motionClick('29');">								<input type="hidden" value="1^HA460|^ H|^2125|2022-03-14T21:25:00.000+09:00^1040|2022-03-14T10:40:00.000-10:00^495|^332|^1085000|10000|0^^52n3S8YynDKAdEy7/LAAAA==|52n3S8YynDKANDy7/LAAAA==|||0^ | ^ICN|^HNL|HNL^Y^    ^7 ^52n3S8YynDKAhIy7/LAAAA==^  ^  ^211000||^  ^  ^  ^10000|^29'
		depCheck = eval("document.frmForm.depCheck"+tmp[0]).value;
		if (tmp[0] == "1" && stop != "stop") {
			aSelectData.length = 0; // 선택된 값 클리어 2024-04-24
			airCode1 = document.frmForm.airCode1.value;
			airAllClear (airCode1);
			if (airCode1 != "" && depCheck == tmp[24]) {
				$(".depBox").removeClass("link_nodrop");
				$(".a-list-item").removeClass ("link_none");
				$("#Departure"+tmp[0]+"_"+depCheck).removeClass("on_select");
				$(".item-innn_"+tmp[0]).removeClass("on_select");
				$("#revButton").hide ();
				$("#ruleButton").hide ();
				return false;
			}
			air1 = tmp[1].substring(0,2);
			//if (air1 == "OZ") Obj.atr_yes.value = "A";
			//else Obj.atr_yes.value = tmp[13];
			Obj.atr_yes.value = tmp[13];
			//airLinkView (tmp[16],1) ;
		} else {
			if (document.frmForm.airCode1.value == "") {
				// 링크 가능한 여정 보여 주시 2022-03-23
				//airLinkView (tmp[16],tmp[0]) ;
			}
		}

			if (depCheck != "" && depCheck != tmp[24]) {
				$("#Departure"+tmp[0]+"_"+depCheck).removeClass("on_select");
				$(".item-innn_"+tmp[0]).removeClass("on_select"); // 2024-04-21 추가 // 경유 시작편 선택시 후속편 선택 제거
			}
			$("#Departure"+tmp[0]+"_"+tmp[24]).addClass("on_select");
			if (stop != "stop") $("#DepBoxOutline_"+tmp[0]+"_"+tmp[24]+"_1").addClass("on_select"); // 2024-04-21 추가
			eval("document.frmForm.depCheck"+tmp[0]).value = tmp[24];

			eval("document.frmForm.airCode"+Minor).value       = aCode[0];
			eval("document.frmForm.depCity"+Minor).value       = dCity[0];
			eval("document.frmForm.arrCity"+Minor).value       = aCity[0];
			eval("document.frmForm.airClass"+Minor).value      = trim(aClass[0]);
			eval("document.frmForm.airTime"+Minor+"_1").value  = dTime[0];
			eval("document.frmForm.airTime"+Minor+"_2").value  = aTime[0];
			eval("document.frmForm.DepartureTime"+Minor).value = trim(dTime[1]);
			eval("document.frmForm.ArriveTime"+Minor).value    = trim(aTime[1]);
			eval("document.frmForm.airRule"+Minor).value       = aKey[0];
			eval("document.frmForm.airSeg"+Minor).value        = aKey[1];
			eval("document.frmForm.airEquip"+Minor).value      = aEquip[0];
			eval("document.frmForm.airFltTm"+Minor).value      = aFlt[0];
			eval("document.frmForm.Groups"+Minor).value        = tmp[0];

			eval("document.frmForm.DepTerminal"+Minor).value   = dCity[2];
			eval("document.frmForm.ArrTerminal"+Minor).value   = aCity[2];

			eval("document.frmForm.Cabin"+Minor).value         = aInfos[0];
			eval("document.frmForm.Baggage"+Minor).value       = aInfos[1];
			eval("document.frmForm.AvailCount"+Minor).value    = aInfos[2];
			eval("document.frmForm.Distance"+Minor).value      = distance1;
			aSelectData[tmp[0]] = trim(aCode[0])+trim(aClass[0]);
			if (aCode[1] != "") {
				Minor2 = Minor + 1;
				eval("document.frmForm.airCode"+Minor2).value       = aCode[1];
				eval("document.frmForm.airClass"+Minor2).value      = trim(aClass[1]);
				eval("document.frmForm.DepartureTime"+Minor2).value = trim(aKey[5]);
				eval("document.frmForm.ArriveTime"+Minor2).value    = trim(aKey[6]);
				eval("document.frmForm.depCity"+Minor2).value       = dCity[1];
				eval("document.frmForm.arrCity"+Minor2).value       = aCity[1];
				eval("document.frmForm.airSeg"+Minor2).value        = trim(aKey[2]);
				eval("document.frmForm.airEquip"+Minor2).value      = aEquip[1];
				eval("document.frmForm.airFltTm"+Minor2).value      = aFlt[1];
				eval("document.frmForm.Groups"+Minor2).value        = tmp[0];

				eval("document.frmForm.DepTerminal"+Minor2).value   = dCity[3];
				eval("document.frmForm.ArrTerminal"+Minor2).value   = aCity[3];

				eval("document.frmForm.Cabin"+Minor2).value         = aInfos[3];
				eval("document.frmForm.Baggage"+Minor2).value       = aInfos[4];
				eval("document.frmForm.AvailCount"+Minor2).value    = aInfos[5];

				eval("document.frmForm.Distance"+Minor2).value      = distance2;
				eval("document.frmForm.OperatingAirline"+Minor2).value  = aInfos[8];

				//eval("document.frmForm.airRule"+Minor2).value       = "";
				//eval("document.frmForm.airCode"+Minor2).value       = "";
				eval("document.frmForm.nextKey").value              = Minor2 + 1;
				aSelectData[tmp[0]] += ":"+trim(aCode[1])+trim(aClass[1]);
			} else {
				Obj.nextKey.value        = Minor + 1;
			}

			eval("document.frmForm.OperatingAirline"+Minor).value     = tmp[8];
			eval("document.frmForm.tripKey"+(Number(tmp[0])+1)).value = Obj.nextKey.value;
			eval("document.frmForm.airPrice"+tmp[0]).value            = aPrice[0];
			//eval("document.frmForm.Child"+Minor).value              = aPrice[1];
			//eval("document.frmForm.Infant"+Minor).value             = aPrice[2];

			eval("document.frmForm.Child"+tmp[0]).value               = aPrice[1];
			eval("document.frmForm.Infant"+tmp[0]).value              = aPrice[2];
			if (tmp[0] == "1" && stop != "stop") {
				aCom				 = tmp[23].split("|")[0].split(",");
				frmForm.issueComm.value   = aCom[0];
				frmForm.issueComm1.value  = aCom[1];
				frmForm.issueComm2.value  = aCom[2];
				frmForm.issueComm3.value  = aCom[3];
				frmForm.AccountCode.value = aCom[4];

				//$("#tasfInter").val(aCom[0])
				//tasfChange ();
			}
//			Obj.issue_comm1.value  = aCom[0];
//			Obj.issue_comm2.value  = "0";
//			Obj.partnerComm1.value = aCom[1];
//			Obj.partnerComm2.value = "0";

			//SelRadio1 = Obj.SelRadio1.value;

			//if (Number(tmp[15]) < 4) 
			if (tmp[15] == "A") tmp[15] = "4";
			Obj.max_member.value = tmp[15]; // 최대 인원 선택

			issue_comm    = Number(Obj.issueComm1.value);
			issueCommSite = Number(Obj.issueCommSite.value);
			p_point       = Number(Obj.partnerComm1.value) + Number(Obj.partnerComm2.value);


			$(".swiper-button-next").click();
			//if (Minor == 1) {
				joinKey = tmp[16];
				//Obj.Price_Key.value = joinKey;

				idname = "Departure";
				//airCheck1  = trim(aCode[0])+trim(aClass[0]);
				//if (aCode[1] != "") airCheck1  += ":"+trim(aCode[1])+trim(aClass[1]);
				airCheck1 = "";
				for (ix = 1 ; ix < Number(tmp[0]) + 1 ; ix ++) {
					if (airCheck1 != "") airCheck1 += "_";
					airCheck1 += aSelectData[ix];
				}
				// 현재의 다음루팅을 지정하게 변경 2024-04-24
				//for (routeCnt = 2; routeCnt < 7 ; routeCnt ++ ){ 
				routeCnt = Number(tmp[0]) + 1;
					$(".item-innn_"+routeCnt).hide();
					$(".DepartureBox"+routeCnt).hide(); // 2024-04-22 위치 변경

					// 경유편또는 직항이 결합이 되기에 변경함. 2024-04-23 
					arrCnt = 0 ;
					ids = idname + routeCnt + "_";
					while (document.getElementById(ids+arrCnt)) {
						val = document.getElementById("depValue"+routeCnt+"_"+arrCnt).value;
						arrTmp = Explode("^",val);
						//aPrice = Explode("|",arrTmp[7]);
						tmp1   = arrTmp[1].split("|"); // 코드
						tmp2   = arrTmp[2].split("|"); // 클래스
						airCheck2  = trim(tmp1[0])+trim(tmp2[0]);
						if (tmp1[1] != "") {
							// 경유편
							airCheck2  += ":"+trim(tmp1[1])+trim(tmp2[1]);
							subCnt = 1;
							while (document.getElementById("depValue"+routeCnt+"_"+arrCnt+"_"+subCnt)) {
								val = document.getElementById("depValue"+routeCnt+"_"+arrCnt+"_"+subCnt).value;
								arrTmp = Explode("^",val);
								aPrice = Explode("|",arrTmp[7]);
								tmp1   = arrTmp[1].split("|"); // 코드
								tmp2   = arrTmp[2].split("|"); // 클래스
								airCheck2  = trim(tmp1[0])+trim(tmp2[0]);
								if (tmp1[1] != "") airCheck2  += ":"+trim(tmp1[1])+trim(tmp2[1]);
								//if (routeCnt > 2) add = routeCnt+"-"; else add = "";
								//clog(arrTmp[16]+ " " +joinKey);
								if (arrayCompCheck(arrTmp[16],joinKey) == 1) {
									amt    = 0;
									amtTot = 0;
									for ( aCnt = 0 ; aCnt < aJoinData.length ; aCnt ++) {
										lineData = aJoinData[aCnt];
										aLine = lineData.split("//");
										//if (routeCnt == 2) clog(aLine[0] + " " + airCheck1+"_"+airCheck2)
										airJoinData = airCheck1+"_"+airCheck2;
										len = airJoinData.length ;
										if (aLine[0].substring(0,len) == airJoinData) {
											amt    = Number(aLine[2]) - Number(aPrice[0]);
											amtTot = Number(aLine[2]) + Number(aLine[5]) + issue_comm;
//											if (tmp1[0] == "SC1191")	clog(aLine[2] + " " + aPrice[0] + " " + amt + " " + amtTot);
											if (amt >= 0) symbol = "+"; else symbol = "";
											$("#DepBoxPrice_"+routeCnt+"_"+arrCnt+"_"+subCnt).html(symbol+commaSplit(amt)+"원");
											$("."+airCheck2.replace(":","__")).show();
											$("#DepartureBox"+routeCnt+"_"+arrCnt).show();
											//if (ticket_type == "3") $("#Seg"+routeCnt+"_"+arrCnt).html("");
											//else $("#Seg"+routeCnt+"_"+arrCnt).html(symbol+commaSplit(amt)+"원");
											$("#Seg"+routeCnt+"_"+arrCnt).html("");
											$("#SegSum"+routeCnt+"_"+arrCnt).html(commaSplit(amtTot)+"원");
											$("#Departure"+routeCnt+"_"+arrCnt).show(); // 2024-04-21 추가
											break;
										}
									}
								} else {
									//$("#Seg"+routeCnt+"_"+arrCnt).html("+0원");
									//$("#SegSum"+routeCnt+"_"+arrCnt).html("");
									//$("#Departure"+routeCnt+"_"+arrCnt).hide(); // 2024-04-21 추가
								}
								subCnt ++;
							}
						} else {
							// 직항편
							if (routeCnt > 2) add = routeCnt+"-"; else add = "";
							if (arrayCompCheck(arrTmp[16],joinKey) == 1) {
								amt    = 0;
								amtTot = 0;
								aPrice = Explode("|",tmp[7]);
								for ( aCnt = 0 ; aCnt < aJoinData.length ; aCnt ++) {
									lineData = aJoinData[aCnt];
									aLine = lineData.split("//");
									airJoinData = airCheck1+"_"+airCheck2;
									len = airJoinData.length ;
									if (aLine[0].substring(0,len) == airJoinData) {
										amt    = Number(aLine[2]) - Number(aPrice[0]);
										amtTot = Number(aLine[2]) + Number(aLine[5]) + issue_comm;
										if (amt >= 0) symbol = "+"; else symbol = "";
										if (ticket_type == "3") $("#Seg"+routeCnt+"_"+arrCnt).html("");
										else $("#Seg"+routeCnt+"_"+arrCnt).html(symbol+commaSplit(amt)+"원");
										//$("#Seg"+routeCnt+"_"+arrCnt).html("");
										$("#SegSum"+routeCnt+"_"+arrCnt).html(commaSplit(amtTot)+"원");
										$("#Departure"+routeCnt+"_"+arrCnt).show(); // 2024-04-21 추가
										$("#DepartureBox"+routeCnt+"_"+arrCnt).show(); // 2024-04-22 
										break;
									}
								}
							} else {
								$("#Seg"+routeCnt+"_"+arrCnt).html("+0원");
								$("#SegSum"+routeCnt+"_"+arrCnt).html("");
								//$("#Departure"+routeCnt+"_"+arrCnt).hide(); // 2024-04-21 추가
							}
						}
						arrCnt ++;
					}


			//posName   = "가는편"; 
			aFlight = tmp[1].split("|");
			flight  = aFlight[0];
			if (aFlight[1] != "") flight += " → "+aFlight[1];
		
		if (tmp[0] == "1") {
			Obj.airPrice2.value = "0";
		}

		if (ticket_type == "1") document.all.revButton.disabled = false;
		else if (ticket_type == "2"  && eval("document.frmForm.depCheck2").value != "") document.all.revButton.disabled = false;
		else if (ticket_type == "3" && eval("document.frmForm.depCheck"+RouteCount).value != "") document.all.revButton.disabled = false;
		else document.all.revButton.disabled = true;

		issueCommSite2 = ( issueCommSite * mem1 ) + ( issueCommSite * mem2) ;

		tPrice = 0;

		if (document.all.revButton.disabled == false && $("#reSearchButton").css("display") == "none") { // 2023-01-31 승객 인원수에 따른 예약 버튼 생성
			$("#revButton").show ();
			$("#ruleButton").show ();

			key = "";
			for (ix = 1 ; ix < 9 ; ix ++) {
				airCode = trim(eval("document.frmForm.airCode"+ix).value) ;
				airClass = trim(eval("document.frmForm.airClass"+ix).value) ;
				//clog(airCode + " " + airClass) ;
				if (airCode != "") {
					if (key != "") key += "_";
					key += airCode+airClass;
				}
			}

			compCheckStatus = false;
			for (ix = 0 ; ix < aJoinData.length ; ix ++) {
				aData = aJoinData[ix].split("//");
				compData = aData[0].replace(/:/g,"_");
				//clog(compData + " " + key)
				if (compData == key) {
					compCheckStatus = true;
					break;
				}
			}

			if (compCheckStatus == false) {
				//alert("요금 결합에 문제가 발생하였습니다. 관리자에게 문의 하세요!"); 
				$("#revButton").hide ();
				$("#ruleButton").hide ();
				//return ;
			}

			aSeg = aData[1].split("-v-");
			for (ix = 0 ; ix < aSeg.length ; ix ++) {
			//	eval("document.frmForm.airSeg"+(ix+1)).value = aSeg[ix];
			}
			aRule = aData[8].split("-v-");
			for (ix = 0 ; ix < aRule.length ; ix ++) {
				eval("document.frmForm.airRule"+(ix+1)).value = aRule[ix];
			}

			Obj.adult_price.value  = aData[2];
			Obj.child_price.value  = aData[3] ? aData[3] : 0;
			Obj.infant_price.value = aData[4] ? aData[4] : 0;

			Obj.adult_tax.value    = aData[5];
			Obj.child_tax.value    = aData[6] ? aData[6] : 0;
			Obj.infant_tax.value   = aData[7] ? aData[7] : 0;

			tp  = Number(aData[2] * mem1) + Number(aData[3] * mem2) + Number(aData[4] * mem3);
			tp2 = tp + (aData[5] * mem1) + (aData[6] * mem2) + (aData[7] * mem3) ;
			ic  = Number(issue_comm / ( parseInt(mem1) + parseInt(mem2) ) );

			Obj.TotalPrice.value = tp2;
			Obj.Price_Key.value  = aData[9]; // price key 변경

			if (Obj.atr_yes.value == "GN") {
				// 2024-09-26 NDC 일경우 조합키가 안맞아서 추가 로직
				pData = aData[1].split("-v-");
				for (ix = 0 ; ix < pData.length ; ix ++) {
					eval("document.frmForm.airSeg"+(ix+1)).value        = pData[ix];
				}
			}


		} else {
			$("#revButton").hide ();
			$("#ruleButton").hide ();
		}


		if (air1 != "") {
			//sFile = "rule_simple.php?departure_date="+frmForm.departure_date.value+"&departure="+frmForm.departure.value+"&arrive="+frmForm.arrive.value+"&airCode1="+frmForm.airCode1.value+"&airClass1="+frmForm.airClass1.value;
			//parent.frames["HIDE_ACTION"].location.href = sFile;
		}

		//displayStatus = document.getElementById("OpenView_"+tmp[22]).style.display;
		//if (displayStatus == "none") motionClick (tmp[22]);
		//if (stop != "stop") motionClick (tmp[0],tmp[22]);
		if (stop != "stop") motionClick (tmp[0],tmp[24]);
		if (stop != "stop" && aCode[1] != "") {
			$("#DepBoxSub_"+tmp[0]+"_"+tmp[24]+"_1").click();
		}
	}
	function ruleView (tg) {
		//dropLoadStart ("룰 조회중!!");
		//smallPopShow ("",400,400);
		//document.getElementById("smallPopupData").innerHTML = loadStartCircle ("룰 조회중!!");
//		LoadingStart ("룰 조회중!!");
		loadCircle ("룰 조회중!!");
		$("#basePopUp").show();
		if (document.frmForm) Obj = document.frmForm;
		else if (document.frmReserve) Obj = document.frmReserve;
		uid = rule2 = rule3 = rule4 = airSeg2 = airSeg3 = airSeg4 = airCode1 = airCode2 = airCode3 = airCode4 = depCity1 = depCity2 = depCity3 = depCity4 = arrCity1 = arrCity2 = arrCity3 = arrCity4 = "";
		if (Obj.uid) uid = Obj.uid.value;
		rule1 = Obj.airRule1.value;
		if (Obj.atr_yes) atr_yes = Obj.atr_yes.value;

		if (Obj.airRule2) rule2 = Obj.airRule2.value;
		if (Obj.airRule3) rule3 = Obj.airRule3.value;
		if (Obj.airRule4) rule4 = Obj.airRule4.value;

		airSeg1 = Obj.airSeg1.value;
		if (Obj.airSeg2) airSeg2 = Obj.airSeg2.value;
		if (Obj.airSeg3) airSeg3 = Obj.airSeg3.value;
		if (Obj.airSeg4) airSeg4 = Obj.airSeg4.value;

		airCode1 = Obj.airCode1.value;
 		if (Obj.airCode2) airCode2 = Obj.airCode2.value;
		if (Obj.airCode3) airCode3 = Obj.airCode3.value;
		if (Obj.airCode4) airCode4 = Obj.airCode4.value;

		depCity1 = Obj.depCity1.value;
 		if (Obj.depCity2) depCity2 = Obj.depCity2.value;
		if (Obj.depCity3) depCity3 = Obj.depCity3.value;
		if (Obj.depCity4) depCity4 = Obj.depCity4.value;

		arrCity1 = Obj.arrCity1.value;
 		if (Obj.arrCity2) arrCity2 = Obj.arrCity2.value;
		if (Obj.arrCity3) arrCity3 = Obj.arrCity3.value;
		if (Obj.arrCity4) arrCity4 = Obj.arrCity4.value;

		DepartureTime1 = Obj.DepartureTime1.value;
 		if (Obj.DepartureTime2) DepartureTime2 = Obj.DepartureTime2.value;
		if (Obj.DepartureTime3) DepartureTime3 = Obj.DepartureTime3.value;
		if (Obj.DepartureTime4) DepartureTime4 = Obj.DepartureTime4.value;

		add = "&airCode1="+airCode1+"&airCode2="+airCode2+"&airCode3="+airCode3+"&airCode4="+airCode4;
		add += "&depCity1="+depCity1+"&depCity2="+depCity2+"&depCity3="+depCity3+"&depCity4="+depCity4;
		add += "&arrCity1="+arrCity1+"&arrCity2="+arrCity2+"&arrCity3="+arrCity3+"&arrCity4="+arrCity4;
		add += "&DepartureTime1="+DepartureTime1+"&DepartureTime2="+DepartureTime2+"&DepartureTime3="+DepartureTime3+"&DepartureTime4="+DepartureTime4;

		sFile = "../interline/air_rule_view.php?rule1="+rule1+"&rule2="+rule2+"&rule3="+rule3+"&rule4="+rule4+"&tg="+tg+"&uid="+uid+"&atr_yes="+atr_yes+"&airSeg1="+airSeg1+"&airSeg2="+airSeg2 + add;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}

	async function ruleDetail (uid,atr_yes='',tg='') {
		dropLoadStart ("룰 조회중!!");
		json = await dataGhangeSend('','', uid , '', '', '',file='interSearch/airRuleView');
		success  = json.success;
		msg      = json.msg;
		ruleData = json.ruleData;
		if (msg === "re") {
			ruleDetail (uid);
		} else if (success === "ok") {
			smallPopHide();
			$("#basePopUp").show();
			$("#basePopUp").html(ruleData);
		}
	}

	function ruleClose () {
		$("#basePopUp").hide();
		document.getElementById("basePopUp").innerHTML = "";
		$("#SearchSub").show();
	}
	async function reserveView () {
		$("#revPopup").show();
		dropLoadStart ("예약 생성중");
		json = await interPostSend ('bookInput');
		data = json.datas;
		success = json.success;
		if (success == "ok") {
			smallPopHide();
			$("#revPopup").html(data);
			//console.log(json)
			//$("#revPopup").html(data);
			//alert('a')
			//searchLikeView (data);
		} else {
			console.log("검색2 외부 오류 발생"+json);
		}
		return false;
	}

	async function reserveConfirm (e) {
		e.preventDefault();     // 기본 동작 막기
  		e.stopPropagation();    // 이벤트 버블링 막기
		$("#revPopup").show();
		dropLoadStart ("예약 확인중");
	 	json = await interPostSend ('bookConfirm');
		data = json.datas;
		success = json.success;
		if (success == "ok") {
			smallPopHide();
			$("#revPopup").html(data);
			//console.log(json)
			//$("#revPopup").html(data);
			//alert('a')
			//searchLikeView (data);
		} else {
			console.log("검색1 외부 오류 발생"+json);
		}
		return false;
	}

	async function revAction (gubun) {
		Obj = document.frmReserve;
		adult_members = Obj.adt.value;
		child_members = Obj.chd.value;
		infant_members = Obj.inf.value;
		members = Number(adult_members) + Number(child_members) + Number(infant_members);
		Obj.revGubun.value = gubun;
//		if (child_dis != "" && child_members > 0) {
//			alert("어린이판매가 되지않는 클래스가 포함 되어 있습니다.\n\n다른 좌석을 선택하여 주세요");
//			return false;
//		}

		exp1 = /([0-9a-zA-Z])\1{3,}/; // 반복된문자,숫자 체크
		//exp2 = /(\d){3,}/; // 

		msg = "";
		adult_tmp = 0;
		child_tmp = 0;
		infant_tmp = 0;
		//if (Obj.siteName.value == "") msg += "거래처를 먼저 선택하여 주세요.\n";
		if (gubun == "") {
			for (ix = 1 ; ix < members + 1 ; ix ++) {
				tename1 = document.getElementById("tename1_"+ix).value;
				tename2 = document.getElementById("tename2_"+ix).value;
				tbirth  = document.getElementById("tbirth_"+ix).value;
				tsex    = eval("document.frmReserve.tsex_"+ix).value;

				name = trim(tename1 + tename2);
				name = name.toUpperCase();

				if (tename1 == "") msg += ix + "번째 탑승자의 영문성을 입력하여 주세요.\n";
				if (tename2 == "") msg += ix + "번째 탑승자의 영문이름을 입력하여 주세요.\n";
				if (tename1 != "" && English_Field_Check(tename1) == false) msg += ix + "번째 탑승자의 성을 영문으로만 입력을 하여 주세요.\n";
				if (tename2 != "" && English_Field_Check(tename2) == false) msg += ix + "번째 탑승자의 이름을 영문으로만 입력을 하여 주세요.\n";
				if (tsex == "") msg += ix + "번째 탑승자의 성별을 선택 하여 주세요.\n";
				if ((tsex == "MI" || tsex == "FI") && tbirth == "") msg += ix + "번째 탑승자의 생일을 입력하여 주세요.\n";
				if ((tsex == "MC" || tsex == "FC") && tbirth == "") msg += ix + "번째 탑승자의 생일을 입력하여 주세요.\n";
				if (exp1.test(name) == true || continueWord(name,5) == true ||  name.indexOf("TEST") != -1 || name.indexOf("테스트") != -1) msg += ix + "번째 이름이 잘못 되었습니다.";

				if (tsex == "M" || tsex == "F") adult_tmp ++;
				else if (tsex == "MC" || tsex == "FC") child_tmp ++;
				else if (tsex == "MI" || tsex == "FI") infant_tmp ++;
			}
			if (adult_tmp != adult_members)   msg += "신청성인("+adult_members+")과 입력성인("+adult_tmp+")이 일치 하지 않습니다.\n";
			if (child_tmp != child_members)   msg += "신청어린이("+child_members+")과 입력어린이("+child_tmp+")이 일치 하지 않습니다.\n";
			if (infant_tmp != infant_members) msg += "신청유아("+infant_members+")과 입력유아("+infant_tmp+")이 일치 하지 않습니다.\n";
		}
		if (Obj.username1.value == "")    msg += "예약자 정보의 성을 입력하여 주세요!\n";
		if (Obj.username2.value == "")    msg += "예약자 정보의 이름을 입력하여 주세요!\n";
		if (Obj.dep_tel.value == "")      msg += "예약자 정보의 한국 연락처를 입력하여 주세요!\n";
		if (Obj.email.value == "")        msg += "예약자 정보의 이메일를 입력하여 주세요!\n";
		
		if (Obj.site_code.value == "")    msg += "여행사 정보를 입력하여 주세요!\n";
		if (Obj.foreign_addr1 && gubun == "") {
			if (Obj.foreign_addr1.value == "") msg += "목적지 우편번호를 입력하세요\n";
			if (Obj.foreign_addr2.value == "") msg += "목적지 주명을 입력하세요\n";
			if (Obj.foreign_addr3.value == "") msg += "목적지 도시명을 입력하세요\n";
			if (Obj.foreign_addr4.value == "") msg += "목적지 주소를 입력하세요\n";
		}
		if (msg != "") {
			newAlert(msg) 
		} else {
			var Rc = confirm("현재의 예약을 확정 하시겠습니까?");
			if (Rc) {
				//$("#revActionArea").html("예약중입니다.");
				const form = document.getElementById('frmReserve'); 
				const formData = new FormData(form);
				try {
					const res  = await fetch(`/interSearch/interSave`, {
						method: 'POST',
						body: formData
					});
					const json  = await res.json();
					success = json.success;
					uid     = json.uid;
					if (success == "ok") {
						//console.log(json);
						pnrCreate(uid,'Save');
					} else if (success) {
						//console.log(success);
						newAlert(success);
					} else {
						console.log("국제선 저장시 외부 오류 발생"+json);
					}
				} catch (err) {
					console.log("국제선 저장시 내부 오류 발생 " + err)
				}
			}
		}
		return false;
	}
	
	function RevDateCheck(val,name,ix,uid) {
		console.log(val);
		if (val.length == "7") {
			if (DateCheck3(val) == false) return false;
		} else if (val.length == "8") {
			d1 = val.substring(2,4);
			d2 = val.substring(4,6);
			d3 = val.substring(6,8);
			d2 = checkMonth2(d2);
			val = d3+d2+d1;
			if (DateCheck3(val) == false) return false;
			else {
				if (name == "BIRTH") document.getElementById("tbirth_"+ix).value = val;
				else if (name == "EXPIRE") document.getElementById("texpire_"+ix).value = val;
			}
		} else {
			alert("날자를 규격에 맞게 입력하세요");
			if (name == "BIRTH") document.getElementById("tbirth_"+ix).value = "";
			else if (name == "EXPIRE") document.getElementById("texpire_"+ix).value = "";
			return false;
		}
		if (uid) {
			if (name == "BIRTH") dataChange('interline_pax',uid,ix,'birthday',val);
			else if (name == "EXPIRE") dataChange('interline_pax',uid,ix,'expire',val);
		}
	}

	function siteSet (code,name) {
		document.frmReserve.site_code.value = code;
		document.frmReserve.siteName.value  = name;
		smallPopHide ();
		sFile = "../site/manager_set.php?code="+code;
		frames["HIDE_ACTION"].location.href = sFile;
	}


	function issueStart(uid,s) {
		members = document.frmReserve.members.value;
		msg = "";
		issueComm	= Number(document.frmReserve.issueComm.value);
		issueComm1	= Number(document.frmReserve.issueComm1.value);
		issueComm2	= Number(document.frmReserve.issueComm2.value);
		adult_amt	= Number(document.frmReserve.adult_amount.value);
		child_amt	= Number(document.frmReserve.child_amount.value);
		infant_amt	= Number(document.frmReserve.infant_amount.value);
//		if (!top.IssueRobot || top.IssueRobot == "") {
//			// 당일 발권 재 확인 부분
//			if (nows == InDate) {
//				var Rc = confirm("출발일이 오늘입니다. 발권이 확실한가요?");
//				if (Rc == false) {
//					return false;
//				}
//			}
//		}
		if (s != "P") {
			for (ix = 0 ; ix < members ; ix ++ ) {
				ij = ix + 1;
				sex = eval("document.all.tsex_"+ij).value;
				if (eval("document.all.tename1_"+ij).value == "") msg += ij+ " 번째 영문(성)을 입력하세요\n";
				//if (eval("document.all.tename2_"+ij).value == "") msg += ij+ " 번째 영문(이름)을 입력하세요\n";
				if (eval("document.all.tpassport_"+ij).value == "") msg += ij+ " 번째 여권번호를 입력하세요\n";
				if (eval("document.all.texpire_"+ij).value == "") msg += ij+ " 번째 여권유효기간을 입력하세요\n";
				if (eval("document.all.tbirth_"+ij).value == "") msg += ij+ " 번째 생년월일을 입력하세요\n";
				amt1 = Number(StrClear(eval("document.all.cash_price_"+ij).value)) ;
				amt2 = Number(StrClear(eval("document.all.card_price_"+ij).value)) ;
				amt = amt1 + amt2;
				if (amt2 > 0) {
					issueComm1_ = 0; // 카드+현금 발권을 위한 변경 2024-08-14
					issueComm2_ = 0; // 카드+현금 발권을 위한 변경 2024-08-14
				} else {
					issueComm1_ = issueComm1; // 2024-08-22 추가
					issueComm2_ = issueComm2; // 2024-08-22
				}
				if ((sex == "M" || sex == "F") && adult_amt+issueComm1_ != amt) msg += ij+ " 번째 성인 요금이 일치 하지 않습니다.\n";
				else if ((sex == "MC" || sex == "FC") && child_amt+issueComm2_ != amt) msg += ij+ " 번째 소아 요금이 일치 하지 않습니다.\n";
				else if ((sex == "MI" || sex == "FI") && infant_amt != amt) msg += ij+ " 번째 유아 요금이 일치 하지 않습니다.\n";

				if (s == "5" && eval("document.frmReserve.aMethod_"+ij).value == "2") {
					if (eval("document.all.aCardnum1_"+ij).value == "" || eval("document.all.aCardnum2_"+ij).value == "" || eval("document.all.aCardnum3_"+ij).value == "" || eval("document.all.aCardnum4_"+ij).value == "" ) msg += ij+ " 번째 승객의 카드번호을 입력하세요\n";
					if (eval("document.all.aCardPasswd_"+ij).value == "")  msg += ij+ " 번째 승객의 카드비밀번호 앞2자리를 입력하세요\n";
					if (eval("document.all.aJumin2_"+ij).value == "")      msg += ij+ " 번째 승객의 생년월일/사업자번호를 입력하세요\n";
					if (eval("document.all.aInstallment_"+ij).value == "") msg += ij+ " 번째 승객의 할부기간을 선택하세요\n";
				}
			}
			//if (document.all.apis.checked == false) msg += " 아피스 입력 마감 버튼을 먼저 클릭 하여 주세요\n";
			if (document.frmReserve.dep_tel.value == "") msg += " 한국 연락처를 입력하세요\n";
			//if (document.frmReserve.arr_tel.value == "") msg += " 현지 연락처를 입력하세요\n";
		}
		//if (issueBreak == "Y") msg += "셀커넥 참조 번호가 일치 하지 않습니다. HK를 눌러 PNR 재조회후 시도하세요 "; // 셀커넥의 탑승자 참조번호가 없을때
		//if (s == "6") msg = "";

		if (msg != "" && s != "P" ) {
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
		} else if (s == "P") {
			var Rc = confirm("예치금만 차감합니다.");
			if (Rc) {
				sFile = "../interline/issue_start.php?mode=Depo&uid="+uid;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		} else if (s == "X") {
			var Rc = confirm("발권 요청을 취소 하시겠습니까?");
			if (Rc) {
				sFile = "../interline/issue_req.php?uid="+uid+"&val="+s;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		} else {
			var Rc = confirm("자동 발권을 진행합니다.");
			if (Rc) {
				dropLoadStart ("발권이 진행중입니다. <br>기다려 주세요!!!");
				sFile = "../interline/issue_start.php?uid="+uid;
				frames['HIDE_ACTION'].location.href = sFile;
			}
		}
		return false;
	}
	function calClose () {
		$("#calendar_box").toggle(); // 305
		$("#city_item").css("padding-top","20px");
	}
	function autoComplete (Obj, s  ,g) {
		
		currentCity = s ;
		//document.getElementById(area).style.display = "";
		val = Obj.value.toUpperCase();
		len = gData.length;
		val2 = Hangul.assemble(engToKor (val.toLowerCase()));
		if (g > 0) {
			hh = (g-1)*81;
			$("#CitySearchBox").css("top",124 + hh + "px");
		} else {
			$("#CitySearchBox").css("top","124px");
		}
		new_data = "";
		id = 0;

		for (ix = 0 ; ix < len ; ix ++) {
			tmp = gData[ix];
			//console.log(tmp);
			aTmp = tmp.split("/");
			tmp2 = tmp.toUpperCase();
			if (tmp2.indexOf(val) > -1 || (val2 !== "" && tmp2.indexOf(val2) > -1 )) {
				id ++;
				if (top.oyeManagerLanguage == "en") aTmp[2] = aTmp[4];
				//new_data += "<li ID='T"+id+"' class='tap_data' >"+tmp+"</li>";
				//new_data += "<p ID='T"+id+"'class='bm10 hh20 cursor tap_data' style='overflow:hidden;' onClick=\"cityChoice('"+aTmp[0]+"','"+aTmp[2]+"')\"><span class='title_bold'>"+aTmp[0]+", </span>"+aTmp[1]+", "+aTmp[2]+"("+aTmp[4]+"), "+aTmp[3]+"</p>";
				new_data += `<button type='button' onClick='cityChoice("${aTmp[0]}","${aTmp[2]}","${aTmp[3]}")'>${aTmp[2]}, ${aTmp[0]}</button>`;
			}
		}
		if (new_data != "") {
			document.getElementById("CitySearchBoxData").innerHTML = new_data;
		} else {
			document.getElementById("CitySearchBoxData").innerHTML = "<p class='bm10 hh20 ac' style='overflow:hidden;'>데이타 없음</p>";
		}
		$(".city-layer").addClass("is-open");
		if (val == "" ) { // && topStatus == true
			$("#CitySearchBoxData").hide();
			$("#cityData").show();
		} else { // if (topStatus == false)
			$("#CitySearchBoxData").show();
			$("#cityData").hide();
		}
		maxValue = id;
		nextField();
	}

	keyValue = 0;
	maxValue = 0;
	function nextField() {
		keyCode = event.keyCode;
		if (keyCode != "40" && keyCode != "38" && keyCode != "13") {
			keyValue = 0;
			$("#CitySearchBoxData").scrollTop(0);
		}
		height = $("#CitySearchBoxData .tap_data").outerHeight(true) 
		var scrollValue =$("#CitySearchBoxData").scrollTop(); 

		if (keyCode == "40") {
			move = parseInt(height) * (parseInt(keyValue) - 3);
			if (keyValue < maxValue) keyValue++;
			if(keyValue > 3) $("#CitySearchBoxData").scrollTop(move);
		} else if (keyCode == "38") {
			move = parseInt(height) * (parseInt(keyValue) - 5);
			if (keyValue > 0) keyValue--;
			if(keyValue > 3) $("#CitySearchBoxData").scrollTop(move);
		} else if (keyCode == "13") {
			if (keyValue > 0) $("#T"+keyValue).click();
		}
		$(".tap_data").removeClass("tabhover");
		$("#T"+keyValue).addClass("tabhover");
	}
	function jump (cod) {
		if (cod.length == 6) sFile = "../sub/local.html?cCode="+cod;
		//else if (cod.substring(0,4) == "ASKR") sFile = "../sub/detail_resort.html?golf_code="+cod;
		else sFile = "../sub/detail_triple.html?golf_code="+cod;
		location.href = sFile;
	}
	function issueReqCancel (uid) {
		var Rc = confirm("발권 요청을 취소 합니다.");
		if (Rc) {
			sFile = "../interline/data_change.php?mode=reqCancel&uid="+uid;
			frames["HIDE_ACTION"].location.href = sFile;
		}
		return false;
	}
	function paxChange (gu,pos) {
		a = Number(document.frmForm.adt.value);
		c = Number(document.frmForm.chd.value);
		i = Number(document.frmForm.inf.value);
		mem = a + c + i;
		val = eval("document.frmForm."+gu).value;
		if (pos == "+" && mem == 9) {
			alert("전체 인원이 9명 까지만 예약이 됩니다.");
		} else {
			if (gu == "adt") {
				if (pos == "-" && val > 1) {
					val --;
				} else if (pos == "+" && val < 9) {
					val ++;
				}
			} else if (gu == "chd") {
				if (pos == "-" && val > 0) {
					val --;
				} else if (pos == "+" && val < 4) {
					val ++;
				}
			} else if (gu == "inf") {
				if (pos == "-" && val > 0) {
					val --;
				} else if (pos == "+" && val < 3 && i < a) {
					val ++;
				}
			}
			eval("document.frmForm."+gu).value = val;
			document.getElementById(gu+"2").value = val;
		}
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

	// 2024-03-07 추가됨 여정별 캐빈 설정 가능
	function cabinChangeSingle (p,g) {
		     if (g == "Y") name = "이코노미";
		else if (g == "P") name = "이코노미 프리미엄";
		else if (g == "C") name = "비즈니스";
		else if (g == "F") name = "퍼스트";
		
		Obj   = document.frmForm;
		ticket_type = Obj.ticket_type.value;
		eval("document.frmForm.airCabin"+p).value = g;
		$("#cabinName"+p).html(name);
		$("#cabinName"+p+"_").html(name);
		if (document.getElementById("cabinCheck"+p+"_")) document.getElementById("cabinCheck"+p+"_").checked = false;
		if (document.getElementById("cabinCheck"+p))     document.getElementById("cabinCheck"+p).checked = false;
	}

	function memberSet () {
		Obj   = document.frmForm;
		grade = Obj.grade.value;
		a = document.frmForm.adt.value;
		c = document.frmForm.chd.value;
		i = document.frmForm.inf.value;
		if (grade == "STU") data =  "학생 "+a;
		else if (grade == "LBR") data =  "노무자 "+a;
		else if (grade == "VFR") data =  "다문화 "+a;
		else data =  "성인 "+a;
		if (c > 0) data += " 소아 " +c;
		if (i > 0) data += " 유아 " +i;
		//if (grade == "Y") data += ", 이코노미";
		//else if (grade == "C") data += ", 비지니스";
		//else if (grade == "F") data += ", 퍼스트";
		$("#seat-box").html(data);
		if($("#revButton").css("display") == "block" || $("#FilterArea").css("display") == "block") $("#reSearchButton").show ();
		$("#revButton").hide ();
		$("#ruleButton").hide ();
	}
	function cityChange () {
		sotoName = document.getElementById("ticketType4").innerHTML;
		if (sotoName == "해외출발") sotoName = "국내출발";
		else sotoName = "해외출발";
		document.getElementById("ticketType4").innerHTML = sotoName ;
		Obj = document.frmForm;
		dep1 = Obj.departure.value;
		arr1 = Obj.arrive.value;
		dep2 = Obj.departure2.value;
		arr2 = Obj.arrive2.value;
		Obj.departure.value		= arr1;
		Obj.arrive.value		= dep1;
		Obj.departure2.value	= arr2;
		Obj.arrive2.value		= dep2;

		dep1 = document.getElementById("departure_name").value;
		arr1 = document.getElementById("arrive_name").value;
		//dep2 = document.getElementById("departure2_name").value;
		//arr2 = document.getElementById("arrive2_name").value;
		document.getElementById("departure_name").value	= arr1;
		document.getElementById("arrive_name").value	= dep1;
		//document.getElementById("departure2_name").value	= arr2;
		//document.getElementById("arrive2_name").value		= dep2;
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

	function airDetailShow () {
		if($(this).next("div").is(":visible")) {
			$(this).next("div").slideUp("fast");
			$(this).find("span").removeClass("on");
		} else {
			$(this).addClass("menuOn");
			$(".sub_menu").slideUp("fast");
			$(this).next("div").slideToggle("fast");
		}
	}

	function codeShareViewAction (s) {
		if (s == "") {
			$(".CodeShareArea").show();
		} else {
			$(".CodeShareArea").hide();
		}
	}

	function filterShow (s) {
		interSearchClose();
		$("#"+s).show();
		menuOn = true;
	}

	var searchShare     = "0"; // 9번 데이타 
	var searchAir       = "";  // 1번 
	var searchAirLike   = "";  // 1번 
	var searchCityLike  = "";  // 1번 
	var searchDepTime   = "";  // 3번
	var searchArrTime   = "";  // 4번
	var searchShareTime = ""; 
	var searchPriceG    = "1";
	var searchPrice     = "";  // 7번 
	function searchShareTimeChange (time) {
		if (time != "") {
			if (document.getElementById("SearchShareTimeData_"+time).checked == true) searchShareTime += time+"/";
			else searchShareTime = searchShareTime.replace(time+"/","");
			if (searchShareTime == "") document.getElementById("SearchShareTimeData_ALL").checked = true;
			else document.getElementById("SearchShareTimeData_ALL").checked = false;
		} else {
			for (ix = 1 ; ix < 5 ; ix ++) {
				document.getElementById("SearchShareTimeData_"+ix).checked = false;
			}
			searchShareTime = "";
		}
		searchListView ();
	}
	function searchArrTimeChange (time) {
		if (time != "") {
			if (document.getElementById("SearchArriveTimeData_"+time).checked == true) searchArrTime += time+"/";
			else searchArrTime = searchArrTime.replace(time+"/","");
			if (searchArrTime == "") document.getElementById("SearchArriveTimeData_ALL").checked = true;
			else document.getElementById("SearchArriveTimeData_ALL").checked = false;
		} else {
			for (ix = 1 ; ix < 5 ; ix ++) {
				document.getElementById("SearchArriveTimeData_"+ix).checked = false;
			}
			searchArrTime = "";
		}
		searchListView ();
	}
	function searchDepTimeChange (time) {
		if (time != "") {
			if (document.getElementById("SearchDepartureTimeData_"+time).checked == true) searchDepTime += time+"/";
			else searchDepTime = searchDepTime.replace(time+"/","");
			if (searchDepTime == "") document.getElementById("SearchDepartureTimeData_ALL").checked = true;
			else document.getElementById("SearchDepartureTimeData_ALL").checked = false;
		} else {
			for (ix = 1 ; ix < 5 ; ix ++) {
				document.getElementById("SearchDepartureTimeData_"+ix).checked = false;
			}
			searchDepTime = "";
		}
		searchListView ();
	}
	function searchPriceChange (sorting) {
		for (ix = 1 ; ix < 4 ; ix ++) {
			if (sorting == ix) chk = true; else chk = false;
			document.getElementById("SearchPriceGubunData_"+ix).checked = chk;
		}
		searchPriceG = sorting;
		//searchListView ();
		if (sorting == "1") {
			attrName = "sort";
			order    = "asc";
		} else if (sorting == "2") {
			attrName = "sort";
			order    = "desc";
		} else if (sorting == "3") {
			attrName = "time";
			order    = "asc";
		}
		getSorted( attrName,order) ;
	}
	function searchShareChange (share) {
		for (ix = 0 ; ix < 3 ; ix ++) {
			if (share == ix) chk = true; else chk = false;
			document.getElementById("SearchShareData_"+ix).checked = chk;
		}
		searchShare = share;
		searchListView ();
	}
	function searchAirChange (air) {
		if (air != "") {
			if (document.getElementById("SearchAirData_"+air).checked == true) searchAir += air+"/";
			else searchAir = searchAir.replace(air+"/","");
			if (searchAir == "") document.getElementById("SearchAirData_ALL").checked = true;
			else document.getElementById("SearchAirData_ALL").checked = false;
		} else {
			totalAir = document.frmForm.totalAir.value;
			tmp = Explode("/",totalAir);
			for (ix = 0 ; ix < tmp.length ; ix ++) {
				if (document.getElementById("SearchAirData_"+tmp[ix])) document.getElementById("SearchAirData_"+tmp[ix]).checked = false;
			}
			searchAir = "";
		}
		searchListView ();
	}
	function searchAirLikeChange (air) {
		if (air != "") {
			const chk = document.getElementById("SearchAirLikeData_" + air);
			if (searchAirLike.includes(air)) {
				searchAirLike = searchAirLike.replaceAll(air + "/", "");
				chk.checked = false;
			} else {
				chk.checked = true;
				searchAirLike += air+"/";
			}
			if (searchAirLike == "") document.getElementById("SearchAirLikeData_ALL").checked = true;
			else document.getElementById("SearchAirLikeData_ALL").checked = false;
		} else {
			$("input:checked[name='SearchAirLikeData[]']").each(function(){
				if(air != $(this).val() ) {
					$(this).prop("checked", false);
				}
			});
			searchAirLike = "";
		}
	}
	function searchCityLikeChange (city) {
		if (city != "") {
			if (document.getElementById("SearchCityLikeData_"+city).checked == true) searchCityLike += city+"/";
			else searchCityLike = searchCityLike.replace(city+"/","");
			if (searchCityLike == "") document.getElementById("SearchCityLikeData_ALL").checked = true;
			else document.getElementById("SearchCityLikeData_ALL").checked = false;
		} else {
			$("input:checked[name='SearchCityLikeData[]']").each(function(){
				if(city != $(this).val() ) {
					$(this).prop("checked", false);
				}
			});
			searchCityLike = "";
		}
	}
	function searchListView () {
		$(".subMenuTab").hide();
		for (let itiCnt = 1 ; itiCnt < 7 ; itiCnt ++ ) { 
			let depCnt = 0 ;
			//idname = "Departure_";
			idname = "Departure";
			while (document.getElementById(idname+itiCnt+"_"+depCnt)) {
				let val = document.getElementById("depValue"+itiCnt+"_"+depCnt).value;
				let depTmp = Explode("^",val);
				let air    = depTmp[1].substring(0,2).toUpperCase();
				let aShare = Explode("|",depTmp[9]);
				let dView  = "";
				let aView  = "";
				let sView  = ""; // 경유지 대기 시간
				if (searchDepTime != "") {
					let tmp = Explode("/",searchDepTime);
					for (let ix = 0 ; ix < tmp.length ; ix ++) {
							 if (tmp[ix] == "1" && depTmp[3] >= "0000" && depTmp[3] <= "0559") dView = "Y";
						else if (tmp[ix] == "2" && depTmp[3] >= "0600" && depTmp[3] <= "1159") dView = "Y";
						else if (tmp[ix] == "3" && depTmp[3] >= "1200" && depTmp[3] <= "1759") dView = "Y";
						else if (tmp[ix] == "4" && depTmp[3] >= "1800" && depTmp[3] <= "2359") dView = "Y";
					}
				}
				if (searchArrTime != "") {
					let tmp = Explode("/",searchArrTime);
					for (let ix = 0 ; ix < tmp.length ; ix ++) {
							 if (tmp[ix] == "1" && depTmp[4] >= "0000" && depTmp[4] <= "0559") aView = "Y";
						else if (tmp[ix] == "2" && depTmp[4] >= "0600" && depTmp[4] <= "1159") aView = "Y";
						else if (tmp[ix] == "3" && depTmp[4] >= "1200" && depTmp[4] <= "1759") aView = "Y";
						else if (tmp[ix] == "4" && depTmp[4] >= "1800" && depTmp[4] <= "2359") aView = "Y";
					}
				}
				if (searchShareTime != "") {
					let tmp = Explode("/",searchShareTime);
					aShare[4] = Number(aShare[4]);
					for (let ix = 0 ; ix < tmp.length ; ix ++) {
							 if (tmp[ix] == "1" && aShare[4] >= 0    && aShare[4] <= 240) sView = "Y";
						else if (tmp[ix] == "2" && aShare[4] >= 240  && aShare[4] <= 480) sView = "Y";
						else if (tmp[ix] == "3" && aShare[4] >= 480  && aShare[4] <= 720) sView = "Y";
						else if (tmp[ix] == "4" && aShare[4] >= 720                       ) sView = "Y";
					}
				}
				let view   = "";
				if (
						(searchAir == "" || searchAir.indexOf(air+"/") != -1) 
						&&
						(searchShare == "0" || (searchShare == "1" && aShare[2] == "") || (searchShare == "2" && aShare[2] != ""))
						&&
						(searchDepTime == "" || dView == "Y") 
						&&
						(searchArrTime == "" || aView == "Y") 
						&&
						(searchShareTime == "" || sView == "Y") 
					) view = "Y";
				//if (view == "Y") $("#Departure_"+depCnt).fadeIn();
				//else $("#Departure_"+depCnt).hide();
				if (view == "Y") {
					$("#Departure"+itiCnt+"_"+depCnt).fadeIn();
					$("#DepartureBox"+itiCnt+"_"+depCnt).fadeIn(); // 2024-10-28 추가
				} else {
					$("#Departure"+itiCnt+"_"+depCnt).hide();
					$("#DepartureBox"+itiCnt+"_"+depCnt).hide(); // 2024-10-28 추가
				}
				depCnt ++;
			}
		}
//		arrCnt = 0 ;
//		idname = "Arrive_";
//		while (document.getElementById(idname+arrCnt)) {
//			val = document.getElementById("arrValue_"+arrCnt).value;
//			arrTmp = Explode("^",val);
//			air    = arrTmp[1].substring(0,2);
//			aShare = Explode("|",arrTmp[9]);
//			dView  = "";
//			aView  = "";
//			sView  = "";
//			if (searchDepTime != "") {
//				tmp = Explode("/",searchDepTime);
//				for (ix = 0 ; ix < tmp.length ; ix ++) {
//					     if (tmp[ix] == "1" && arrTmp[3] >= "0000" && arrTmp[3] <= "0559") dView = "Y";
//					else if (tmp[ix] == "2" && arrTmp[3] >= "0600" && arrTmp[3] <= "1159") dView = "Y";
//					else if (tmp[ix] == "3" && arrTmp[3] >= "1200" && arrTmp[3] <= "1759") dView = "Y";
//					else if (tmp[ix] == "4" && arrTmp[3] >= "1800" && arrTmp[3] <= "2359") dView = "Y";
//				}
//			}
//			if (searchArrTime != "") {
//				tmp = Explode("/",searchArrTime);
//				for (ix = 0 ; ix < tmp.length ; ix ++) {
//					     if (tmp[ix] == "1" && arrTmp[4] >= "0000" && arrTmp[4] <= "0559") aView = "Y";
//					else if (tmp[ix] == "2" && arrTmp[4] >= "0600" && arrTmp[4] <= "1159") aView = "Y";
//					else if (tmp[ix] == "3" && arrTmp[4] >= "1200" && arrTmp[4] <= "1759") aView = "Y";
//					else if (tmp[ix] == "4" && arrTmp[4] >= "1800" && arrTmp[4] <= "2359") aView = "Y";
//				}
//			}
//			if (searchShareTime != "") {
//				tmp = Explode("/",searchShareTime);
//				aShare[4] = Number(aShare[4]);
//				for (ix = 0 ; ix < tmp.length ; ix ++) {
//					     if (tmp[ix] == "1" && aShare[4] >= 0    && aShare[4] <= 240) sView = "Y";
//					else if (tmp[ix] == "2" && aShare[4] >= 240  && aShare[4] <= 480) sView = "Y";
//					else if (tmp[ix] == "3" && aShare[4] >= 480  && aShare[4] <= 720) sView = "Y";
//					else if (tmp[ix] == "4" && aShare[4] >= 720                       ) sView = "Y";
//				}
//			}
//			view   = "";
//			if (
//					(searchAir == "" || searchAir.indexOf(air+"/") != -1) 
//					&&
//					(searchShare == "0" || (searchShare == "1" && aShare[2] == "") || (searchShare == "2" && aShare[2] != ""))
//					&&
//					(searchDepTime == "" || dView == "Y") 
//					&&
//					(searchArrTime == "" || aView == "Y") 
//					&&
//					(searchShareTime == "" || sView == "Y") 
//				) view = "Y";
//			if (view == "Y") $("#Arrive_"+arrCnt).fadeIn();
//			else $("#Arrive_"+arrCnt).hide();
//			arrCnt ++;
//		}
	}
	function amtChange (s) {
		pr    = eval("document.frmReserve."+s+"_pr").value;
		tax   = eval("document.frmReserve."+s+"_tax").value;
		mem   = eval("document.frmReserve."+s+"_mem").value;
		if (eval("document.frmReserve."+s+"_shown")) {
			shown = eval("document.frmReserve."+s+"_shown").value;
			dc    = eval("document.frmReserve."+s+"_dc").value;
		} else {
			shown = "";
			dc    = "";
		}
		if (eval("document.frmReserve."+s+"_ic")) ic  = eval("document.frmReserve."+s+"_ic").value;
		else ic = "";
		uid = document.frmReserve.uid.value;
		pUid = document.frmReserve.pUid.value;
		sFile = "data_change.php?mode=priceChange&s="+s+"&pr="+pr+"&tax="+tax+"&uid="+uid+"&ic="+ic+"&mem="+mem+"&shown="+shown+"&dc="+dc+"&pUid="+pUid;
		frames["HIDE_ACTION"].location.href = sFile;
	}
	function priceChange (s) {
		$("#"+s+"Price1").hide();
		$("#"+s+"Price2").show();
		$("#ChdArea").removeClass("none");
		$("#InfArea").removeClass("none");
	}

	function tasfChange () {
		Obj    = document.frmForm;
		adt    = Obj.adt.value;
		chd    = Obj.chd.value;
		inf    = Obj.inf.value;
		amt    = Del_Comma($("#tasfInter").val());
		amt2   = Del_Comma($("#tasfInterSite").val());
		if (amt2 >= 0) {
			amt    = Number(amt);
			amt2   = Number(amt2);
			TotalPrice = Number(frmForm.TotalPrice.value) ;
			frmForm.issueComm.value     = amt;
			frmForm.issueCommSite.value = amt2;
			document.getElementById("tasfInter").value          = commaSplit (amt);
			document.getElementById("tasfInterSite").value      = commaSplit (amt2);
			amt2   = ( amt2 * adt ) + ( amt2 * chd) ;
			document.getElementById("TotalAmount").innerHTML	= commaSplit(TotalPrice+amt+amt2)+"원";
			document.getElementById("customPrice").value		= commaSplit(TotalPrice+amt+amt2);
		} else {
			// 마이너스 타스프 일때
			alert("마이너스 발권수수료는 입력할 수 없습니다.");
			document.getElementById("tasfInterSite").value = 0;
		}
	}

	function customChange () {
		Obj    = document.frmForm;
		issueComm1 = Obj.issueComm1.value;
		issueComm2 = Obj.issueComm2.value;
		adt        = Number(Obj.adt.value);
		chd        = Number(Obj.chd.value);
		amt        = Number(Del_Comma($("#customPrice").val()));
		mem        = adt + chd;
		frmForm.customPrice.value     = amt;
		tasf       = issueComm1 * adt;
		if (issueComm2 != "NAN") tasf       += issueComm2 * chd;
		TotalPrice = Number(Obj.TotalPrice.value) + tasf;
		document.getElementById("customPrice").value        = commaSplit (amt);
		if (TotalPrice < amt) {
			amt2 = (amt - TotalPrice) / mem;
			document.getElementById("tasfInterSite").value      = commaSplit (amt2);
			tasfChange ();
		}
		return false;
	}

	function getSorted( attrName,order) {
		var result = $($(".SortClass").toArray().sort(function(a, b){
			var contentA =parseInt( $(a).data(attrName));
			var contentB =parseInt( $(b).data(attrName));
			if(order == "desc"){
				return (contentA > contentB) ? -1 : (contentA < contentB) ? 1 : 0;
			}else{
				return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
			}
		}));
		$("#airListArea1").append(result);
	}
	function citySwap () {
		Obj = document.frmForm;
		departure_name = Obj.departure_name.value;
		arrive_name    = Obj.arrive_name.value;
		departure      = Obj.departure.value;
		arrive         = Obj.arrive.value;
		Obj.departure_name.value = arrive_name;
		Obj.arrive_name.value    = departure_name;
		Obj.departure.value      = arrive;
		Obj.arrive.value         = departure;
	}
	function airInfo (air) {
		sFile = "../interV2/air_info.php?air="+air;
		frames["HIDE_ACTION"].location.href = sFile;
		return false;
	}