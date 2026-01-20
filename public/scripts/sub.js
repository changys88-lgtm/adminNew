function generateCalendars(names = "", layer = "") {
	if (layer) {
		const container = document.getElementById(layer+'Data');
		if (!container) {
			console.error("Container not found: " + layer+'Data');
			return false;
		}
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const NOWS = `${y}${m}${dd}`;
		
		// 레이어 위치 설정 및 표시
		$("#" + layer).css("top", "167px");
		$("#" + layer).css("left", "14px");
		$("#" + layer).css("display", "block");
		$("#" + layer).addClass("is-open");
		$(".city-layer").removeClass("is-open");
		$(".city-layer").css("display", "none");
		$(".seat-layer").removeClass("is-open");
		$(".seat-layer").css("display", "none");
		
		// 전체 페이지 스크롤 활성화
		$("main.international").addClass("has-calendar-open");
		
		//const now = dates ? StrClear(dates) : formatDate(new Date());
		let ticket_type = "";
		let departure_date = "";
		let arrive_date = "";
		
		if (document.frmForm) {
			ticket_type    = document.frmForm.ticket_type ? document.frmForm.ticket_type.value : "";
			departure_date = document.frmForm.departure_date ? document.frmForm.departure_date.value : "";
			arrive_date    = document.frmForm.arrive_date ? document.frmForm.arrive_date.value : "";
		}
		let year = new Date().getFullYear();
		let month = new Date().getMonth() + 1; // JS는 0부터 시작

		// 먼저 컨테이너 초기화 - 3개월씩 한 줄, 1년치 스크롤바로 보기
		container.innerHTML = '<div class="calendar-body" style="max-height: 440px !important; overflow-y: auto !important; overflow-x: hidden !important; padding: 10px 20px 20px !important; width: 100% !important; box-sizing: border-box !important;"><div class="calendar-wrap" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 20px !important; justify-content: flex-start !important; align-items: flex-start !important; width: 100% !important; box-sizing: border-box !important;">';

		for (let dCnt = 0; dCnt < 12; dCnt++) {
			if (dCnt > 0) month++;
			if (month > 12) {
				year++;
				month = 1;
			}

			const thisMonthDate = new Date(year, month - 1, 1);
			const firstDay = thisMonthDate.getDay(); // 첫 요일
			const lastDate = new Date(year, month, 0).getDate(); // 말일,,,,,,
			const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;

			calendarHTML = "<tr>";
			let dayNum = 0;

			for (let i = 0; i < totalCells; i++) {
				if (i >= firstDay && dayNum < lastDate) {
					dayNum++;
					const curDate = `${year}${String(month).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`;
					const weekDay = new Date(year, month - 1, dayNum).getDay();

					let cls1 = "";
					let cls2 = "";
					let cls3 = "";
					if (weekDay === 0) cls2 = "sun";
					else if (weekDay === 6) cls2 = "sat";
					
					let link = ` onClick="return setInterCal('${year}','${month}','${dayNum}','${names}','${layer}','${weekDay}')" style='cursor:pointer' `;
					if (curDate < NOWS) cls1 = "check_stay";
					else if (departure_date == curDate) cls1 = "start";
					else if (arrive_date    == curDate) cls1 = "end";
					if (curDate === NOWS) cls3 = "today";
					calendarHTML += `<td class="${cls1} ${cls2} ${cls3}" ${link}>${String(dayNum).padStart(2, "0")}</td>`;
				} else {
					calendarHTML += "<td></td>";
				}

				if ((i + 1) % 7 === 0 && i !== totalCells - 1) {
					calendarHTML += "</tr><tr>";
				}
			}

			calendarHTML += "</tr>";

			const monthName = thisMonthDate.toLocaleString("ko-KR", {
				month: "long",
			});

			container.innerHTML += `
				<div class="month-box" style="flex: 0 0 calc((100% - 40px) / 3); width: calc((100% - 40px) / 3); min-width: 0; max-width: calc((100% - 40px) / 3); box-sizing: border-box; margin: 0; padding: 0; float: none; clear: none;">
					<p class="month-t">${year}년 ${month}월</p>
					<table>
						<tr>
							<th class="sun">일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th class="sat">토</th>
						</tr>
						${calendarHTML}
					</table>
				</div>
			`;
		}

		// 컨테이너 닫기
		container.innerHTML += '</div></div>';
		
		// 스타일 강제 적용 - 3개월씩 한 줄 표시
		setTimeout(function() {
			const calendarBody = container.querySelector('.calendar-body');
			const calendarWrap = container.querySelector('.calendar-wrap');
			const monthBoxes = container.querySelectorAll('.month-box');
			
			if (calendarBody) {
				calendarBody.style.setProperty('max-height', '440px', 'important');
				calendarBody.style.setProperty('overflow-y', 'auto', 'important');
				calendarBody.style.setProperty('overflow-x', 'hidden', 'important');
			}
			
			if (calendarWrap) {
				calendarWrap.style.setProperty('display', 'flex', 'important');
				calendarWrap.style.setProperty('flex-direction', 'row', 'important');
				calendarWrap.style.setProperty('flex-wrap', 'wrap', 'important');
				calendarWrap.style.setProperty('gap', '20px', 'important');
				calendarWrap.style.setProperty('width', '100%', 'important');
				calendarWrap.style.setProperty('align-items', 'flex-start', 'important');
			}
			
			monthBoxes.forEach(function(box) {
				box.style.setProperty('flex', '0 0 calc((100% - 40px) / 3)', 'important');
				box.style.setProperty('width', 'calc((100% - 40px) / 3)', 'important');
				box.style.setProperty('min-width', '0', 'important');
				box.style.setProperty('max-width', 'calc((100% - 40px) / 3)', 'important');
				box.style.setProperty('float', 'none', 'important');
				box.style.setProperty('clear', 'none', 'important');
				box.style.setProperty('margin', '0', 'important');
			});
		}, 100);
	}
}


function setInterCal (year,month,day,name,layer,week) {
	if (!document.frmForm) {
		console.error("Form not found: frmForm");
		return false;
	}
	month       = String(month).padStart(2, "0");
	day         = String(day).padStart(2, "0");
	RouteCount  = document.frmForm.RouteCount ? document.frmForm.RouteCount.value : "";
	ticket_type = document.frmForm.ticket_type ? document.frmForm.ticket_type.value : "";
	let val     = year+"-"+month+"-"+day;
	$("#"+name+"_name").html( val + "("+getWeek (week) + ")");
	if (eval("document.frmForm."+name)) {
		eval("document.frmForm."+name).value = year+month+day;
	}
	if (name == "departure_date" && ticket_type == "2") {
		arrive_date = document.frmForm.arrive_date ? document.frmForm.arrive_date.value : "";
		if (document.frmForm.arrive_date) {
			document.frmForm.arrive_date.value = "";
		}
		$("#arrive_date_name").html('');
		generateCalendars("arrive_date",layer);
	} else if ((name == "arrive_date") || (name == "departure_date" && ticket_type == "1") || name.indexOf("dep_date") != -1) {
		calClose (layer);
	}
	let sub = Number(StrClear(name));
	if (ticket_type == "3" && RouteCount && RouteCount > sub) {
		generateCalendars("dep_date"+(sub+1),layer);
	}
}

function generateDomCalendars(names = "", layer = "") {
	if (layer) {
		let container = document.getElementById(layer);
		if (!container) {
			console.error("Container not found: " + layer);
			return false;
		}
		
		// CalendarLayerData 컨테이너 가져오기
		let calendarData = document.getElementById(layer + 'Data');
		if (!calendarData) {
			console.error("Calendar data container not found: " + layer + 'Data');
			return false;
		}
		
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const NOWS = `${y}${m}${dd}`;
		ticket_type   = document.frmForm && document.frmForm.ticket_type ? document.frmForm.ticket_type.value : "";
		dep_date      = document.frmForm && document.frmForm.dep_date ? document.frmForm.dep_date.value : "";
		arr_date      = document.frmForm && document.frmForm.arr_date ? document.frmForm.arr_date.value : "";
		//console.log(dep_date);
		$("#CalendarLayer").css("top", "187px");
		$("#CalendarLayer").css("left", "14px");
		$("#" + layer).css("display", "block");
		$("#" + layer).addClass("is-open");
		$(".city-layer").removeClass("is-open");
		$(".city-layer").css("display", "none");
		$(".seat-layer").removeClass("is-open");
		$(".seat-layer").css("display", "none");
	
		let year = new Date().getFullYear();
		let month = new Date().getMonth() + 1; // JS는 0부터 시작

		// 먼저 컨테이너 초기화 - 3개월씩 한 줄, 1년치 스크롤바로 보기
		calendarData.innerHTML = '<div class="calendar-body" style="max-height: 440px !important; overflow-y: auto !important; overflow-x: hidden !important; padding: 10px 20px 20px !important; width: 100% !important; box-sizing: border-box !important;"><div class="calendar-wrap" style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 20px !important; justify-content: flex-start !important; align-items: flex-start !important; width: 100% !important; box-sizing: border-box !important;">';

		for (let dCnt = 0; dCnt < 12; dCnt++) {
			if (dCnt > 0) month++;
			if (month > 12) {
				year++;
				month = 1;
			}

			const thisMonthDate = new Date(year, month - 1, 1);
			const firstDay = thisMonthDate.getDay(); // 첫 요일
			const lastDate = new Date(year, month, 0).getDate(); // 말일,,,,,,
			const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;

			calendarHTML = "<tr>";
			let dayNum = 0;

			for (let i = 0; i < totalCells; i++) {
				if (i >= firstDay && dayNum < lastDate) {
					dayNum++;
					const curDate = `${year}${String(month).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`;
					const weekDay = new Date(year, month - 1, dayNum).getDay();

					let cls1 = "";
					let cls2 = "";
					let cls3 = "";
					if (weekDay === 0) cls2 = "sun";
					else if (weekDay === 6) cls2 = "sat";
					
					let link = ` onClick="return setDomCal('${year}','${month}','${dayNum}','${names}','${layer}','${weekDay}')" style='cursor:pointer' `;
					if (curDate < NOWS) cls1 = "check_stay";
					else if (dep_date == curDate) cls1 = "start";
					else if (arr_date == curDate) cls1 = "end";
					if (curDate === NOWS) cls3 = "today";
					calendarHTML += `<td class="${cls1} ${cls2} ${cls3}" ${link}>${String(dayNum).padStart(2, "0")}</td>`;
				} else {
					calendarHTML += "<td></td>";
				}

				if ((i + 1) % 7 === 0 && i !== totalCells - 1) {
					calendarHTML += "</tr><tr>";
				}
			}

			calendarHTML += "</tr>";

			const monthName = thisMonthDate.toLocaleString("ko-KR", {
				month: "long",
			});

			calendarData.innerHTML += `
				<div class="month-box" style="flex: 0 0 calc((100% - 40px) / 3); width: calc((100% - 40px) / 3); min-width: 0; max-width: calc((100% - 40px) / 3); box-sizing: border-box; margin: 0; padding: 0; float: none; clear: none;">
					<p class="month-t">${year}년 ${month}월</p>
					<table>
						<tr>
							<th class="sun">일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th class="sat">토</th>
						</tr>
						${calendarHTML}
					</table>
				</div>
			`;
		}
		
		// calendar-wrap 닫기
		calendarData.innerHTML += '</div></div>';
		
		// 스타일 강제 적용 - 3개월씩 한 줄 표시
		setTimeout(function() {
			const calendarBody = calendarData.querySelector('.calendar-body');
			const calendarWrap = calendarData.querySelector('.calendar-wrap');
			const monthBoxes = calendarData.querySelectorAll('.month-box');
			
			if (calendarBody) {
				calendarBody.style.setProperty('max-height', '440px', 'important');
				calendarBody.style.setProperty('overflow-y', 'auto', 'important');
				calendarBody.style.setProperty('overflow-x', 'hidden', 'important');
			}
			
			if (calendarWrap) {
				calendarWrap.style.setProperty('display', 'flex', 'important');
				calendarWrap.style.setProperty('flex-direction', 'row', 'important');
				calendarWrap.style.setProperty('flex-wrap', 'wrap', 'important');
				calendarWrap.style.setProperty('gap', '20px', 'important');
			}
			
			monthBoxes.forEach(function(box) {
				box.style.setProperty('flex', '0 0 calc((100% - 40px) / 3)', 'important');
				box.style.setProperty('width', 'calc((100% - 40px) / 3)', 'important');
				box.style.setProperty('float', 'none', 'important');
			});
		}, 100);
	}
}

function setDomCal (year,month,day,name,layer,week) {
	if (!document.frmForm) {
		console.error("Form not found: frmForm");
		return false;
	}
	month       = String(month).padStart(2, "0");
	day         = String(day).padStart(2, "0");
	ticket_type = document.frmForm.ticket_type ? document.frmForm.ticket_type.value : "";
	let val     = year+"-"+month+"-"+day;
	$("#"+name+"_name").html( val + "("+getWeek (week) + ")");
	if (eval("document.frmForm."+name)) {
		eval("document.frmForm."+name).value = year+month+day;
	}
	if (name == "dep_date" && ticket_type == "2") {
		arr_date = document.frmForm.arr_date ? document.frmForm.arr_date.value : "";
		if (document.frmForm.arr_date) {
			document.frmForm.arr_date.value = "";
		}
		$("#arr_date_name").html('');
		generateDomCalendars("arr_date",layer);
	} else if ((name == "arr_date") || (name == "dep_date" && ticket_type == "1") ) {
		calClose (layer);
	}
}

function calClose (layer='CalendarLayer') {
	$("#" + layer).removeClass("is-open");
	$("#" + layer).css("display", "none");
	$("#" + layer + "Data").empty();
	
	// 전체 페이지 스크롤 비활성화
	$("main.international").removeClass("has-calendar-open");
}

// 날짜 문자열에서 요일(숫자) 구하기
function getWeekFromDateStr(dateStr) {
    const y = parseInt(dateStr.slice(0, 4));
    const m = parseInt(dateStr.slice(4, 6)) - 1;
    const d = parseInt(dateStr.slice(6, 8));
    return new Date(y, m, d).getDay();
}

// 오늘 기준 n일 뒤 날짜 "YYYYMMDD" 형식
function getFutureDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatDate(d);
}

// 주어진 날짜 문자열 기준 offset일 뒤 날짜
function getFutureDateFrom(dateStr, offsetDays) {
    const y = parseInt(dateStr.slice(0, 4));
    const m = parseInt(dateStr.slice(4, 6)) - 1;
    const d = parseInt(dateStr.slice(6, 8));
    const date = new Date(y, m, d);
    date.setDate(date.getDate() + offsetDays);
    return formatDate(date);
}

// 날짜 객체를 YYYYMMDD 문자열로 포맷
function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}