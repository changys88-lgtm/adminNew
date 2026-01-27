	<!--셀렉박스-->
	<div class="select-item" id="FilterArea" style="display:none;">

		 <!-- 🔽 검색 결과 -->
		 <section class="flight-result">

		<!-- 필터 -->
		
		<div class="flight-cols none">

			<!-- ================= 여정 1 ================= -->
			<section class="flight-col">
			<div class="flight-col-head">
				<div class="title">✈ 여정 1</div>
				<div class="day-nav">
				<button>이전날</button>
				<span>출발지 → 도착지</span>
				<button class="primary">다음날</button>
				</div>
			</div>

			<!-- 카드 (선택됨 + 펼침) -->
			<article class="flight-card active open">
				<div class="flight-row">
				<input type="radio" checked>
				<div class="airline">
					<strong>MU5672</strong>
					<span>중국동방항공</span>
				</div>
				<div class="time">
					<strong>13:20</strong><span>YNJ</span>
				</div>
				<div class="arrow">→</div>
				<div class="time">
					<strong>01:00+1</strong><span>SGN</span>
				</div>
				<div class="meta">
					HGH 경유 <br><em>3시간 35분</em>
				</div>
				<div class="seat">9석</div>
				<div class="price">638,100원</div>
				</div>

				<!-- 펼침 상세 -->
			<div class="flight-detail">
				<div class="detail-time">
					<strong>13:20–18:20</strong>
					<span>YNJ → HGH</span>
				</div>

				<div class="detail-meta">
					<span class="code">MU5672</span>
					<span>Economy</span>
					<span>보잉</span>
				</div>
				</div>
			</article>

			<!-- 일반 카드 -->
			<article class="flight-card">
				<div class="flight-row">
				<input type="radio">
				<div class="airline">
					<strong>MU5652</strong>
					<span>중국동방항공</span>
				</div>
				<div class="time"><strong>10:40</strong><span>YNJ</span></div>
				<div class="arrow">→</div>
				<div class="time"><strong>01:10+1</strong><span>SGN</span></div>
				<div class="meta">PVG 경유<br><em>7시간 40분</em></div>
				<div class="seat">9석</div>
				<div class="price">638,100원</div>
				</div>
			</article>
			</section>

			<!-- ================= 여정 2 ================= -->
			<section class="flight-col">
			<div class="flight-col-head">
				<div class="title">✈ 여정 1</div>
				<div class="day-nav">
				<button>이전날</button>
				<span>출발지 → 도착지</span>
				<button class="primary">다음날</button>
				</div>
			</div>
			<section class="flight-col">
			<div class="day-nav">
				<button class="day-btn today">오늘</button>
				<button class="day-btn prev">이전날</button>

				<div class="route-label">
					<span>출발지</span>
					<i class="arrow">→</i>
					<span>도착지</span>
				</div>

				<button class="day-btn next">다음날</button>
				</div>

			<article class="flight-card">
				<div class="flight-row">
				<input type="radio">
				<div class="airline">
					<strong>KE476</strong>
					<span>대한항공</span>
				</div>
				<div class="time"><strong>23:50</strong><span>SGN</span></div>
				<div class="arrow">→</div>
				<div class="time"><strong>10:50+1</strong><span>YNJ</span></div>
				<div class="meta blue">ICN 경유<br><em>2시간 35분</em></div>
				<div class="seat">8석</div>
				<div class="price blue">1,686,100원</div>
				</div>
			</article>
			</section>

		</div>
		</section>
		
		<!--직항/경유-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchShare')" >
				<p>직항/경유</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchShare" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareData" checked id="SearchShareData_0"  onClick="return searchShareChange(this.value)" value="0"><label class="custom-control-label" for="SearchShareData_0">전체</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareData" id="SearchShareData_1" onClick="return searchShareChange(this.value)" value="1"><label class="custom-control-label" for="SearchShareData_1">직항</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareData" id="SearchShareData_2" onClick="return searchShareChange(this.value)" value="2"><label class="custom-control-label" for="SearchShareData_2">경유1</label>
						</div>
					</li>
					<!--
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="cancel2" id="cancel2" value="Y"><label class="custom-control-label" for="cancel2">경유2회 이상</label>
						</div>
					</li>
					-->
				</ul>
			</div>
		</div>
		<!--직항/경유//-->

		<!--항공사-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchAir')" >
				<p>항공사</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchAir" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchAirData"  checked id="SearchAirData_ALL" value="" onClick="return searchAirChange(this.value)"><label class="custom-control-label" for="SearchAirData_ALL">전체</label>
						</div>
					</li>
					
				</ul>
			</div>
		</div>
		<!--항공사//-->

		<!--출발시각-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchDepartureTime')" >
				<p>출발시간</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchDepartureTime" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchDepartureTimeData" checked id="SearchDepartureTimeData_ALL" onClick="return searchDepTimeChange(this.value)" value=""><label class="custom-control-label" for="SearchDepartureTimeData_ALL">전체</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchDepartureTimeData" id="SearchDepartureTimeData_1" onClick="return searchDepTimeChange(this.value)" value="1"><label class="custom-control-label" for="SearchDepartureTimeData_1">00:00 ~ 05:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchDepartureTimeData" id="SearchDepartureTimeData_2" onClick="return searchDepTimeChange(this.value)" value="2"><label class="custom-control-label" for="SearchDepartureTimeData_2">06:00 ~ 11:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchDepartureTimeData" id="SearchDepartureTimeData_3" onClick="return searchDepTimeChange(this.value)" value="3"><label class="custom-control-label" for="SearchDepartureTimeData_3">12:00 ~ 17:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchDepartureTimeData" id="SearchDepartureTimeData_4" onClick="return searchDepTimeChange(this.value)" value="4"><label class="custom-control-label" for="SearchDepartureTimeData_4">18:00 ~ 23:59</label>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<!--출발시각//-->

		<!--도착시간-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchArriveTime')" >
				<p>도착시간</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchArriveTime" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchArriveTimeData" checked id="SearchArriveTimeData_ALL" onClick="return searchArrTimeChange(this.value)" value=""><label class="custom-control-label" for="SearchArriveTimeData_ALL">전체</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchArriveTimeData" id="SearchArriveTimeData_1" onClick="return searchArrTimeChange(this.value)" value="1"><label class="custom-control-label" for="SearchArriveTimeData_1">00:00 ~ 05:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchArriveTimeData" id="SearchArriveTimeData_2" onClick="return searchArrTimeChange(this.value)" value="2"><label class="custom-control-label" for="SearchArriveTimeData_2">06:00 ~ 11:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchArriveTimeData" id="SearchArriveTimeData_3" onClick="return searchArrTimeChange(this.value)" value="3"><label class="custom-control-label" for="SearchArriveTimeData_3">12:00 ~ 17:59</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchArriveTimeData" id="SearchArriveTimeData_4" onClick="return searchArrTimeChange(this.value)" value="4"><label class="custom-control-label" for="SearchArriveTimeData_4">18:00 ~ 23:59</label>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<!--도착시간//-->
		<!--소요시간-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchShareTime')" >
				<p>경유시간</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchShareTime" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareTimeData" checked id="SearchShareTimeData_ALL" onClick="return searchShareTimeChange(this.value)" value=""><label class="custom-control-label" for="SearchShareTimeData_ALL">전체</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareTimeData" id="SearchShareTimeData_1" onClick="return searchShareTimeChange(this.value)" value="1"><label class="custom-control-label" for="SearchShareTimeData_1">0 시간 ~ 4시간 </label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareTimeData" id="SearchShareTimeData_2" onClick="return searchShareTimeChange(this.value)" value="2"><label class="custom-control-label" for="SearchShareTimeData_2">4시간 ~ 8시간</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareTimeData" id="SearchShareTimeData_3" onClick="return searchShareTimeChange(this.value)" value="3"><label class="custom-control-label" for="SearchShareTimeData_3">8시간 ~ 12시간</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" name="SearchShareTimeData" id="SearchShareTimeData_4" onClick="return searchShareTimeChange(this.value)" value="4"><label class="custom-control-label" for="SearchShareTimeData_4">12시간 이상</label>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<!--소요시각//-->

		<!--요금시간-->
		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('SearchPriceGubun')" >
				<p>정렬순서</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchPriceGubun" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" checked name="SearchPriceGubunData" id="SearchPriceGubunData_1" onClick="return searchPriceChange(this.value)" value="1"><label class="custom-control-label" for="SearchPriceGubunData_1">가격낮은순</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox"  name="SearchPriceGubunData" id="SearchPriceGubunData_2" onClick="return searchPriceChange(this.value)" value="2"><label class="custom-control-label" for="SearchPriceGubunData_2">가격높은순</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox"  name="SearchPriceGubunData" id="SearchPriceGubunData_3" onClick="return searchPriceChange(this.value)" value="3"><label class="custom-control-label" for="SearchPriceGubunData_3">출빌시간순</label>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<!--요금시간//-->

		<!--가격대-->
		<div class="select-item-in none">1
			<div class="select-form" onClick="filterShow('SearchPrice')" >
				<p>가격</p>
			</div>
			<div class="select-form-view" style="display:none ;" ID="SearchPrice" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="checkbox" checked name="SearchPriceData" id="SearchPriceData" value="Y"><label class="custom-control-label" for="cancel2">전체</label>
						</div>
					</li>
				</ul>
			</div>
		</div>
		<!--가격대//-->

		<div class="select-item-in">
			<div class="select-form" onClick="filterShow('codeShareView')"  style='height:40px;'>
				<p>코드쉐어</p>
			</div>
			<div class="select-form-view" style="display:none;" ID="codeShareView" >
				<ul>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="radio" name="codeShareInclude"  checked  id="codeShareInclude1" value="" onClick="codeShareViewAction(this.value)">
							<label class="custom-control-label" for="codeShareInclude1">전체보기</label>
						</div>
					</li>
					<li>
						<div class="air-c-group custom-checkbox">
							<input class="custom-control-input" type="radio" name="codeShareInclude"    id="codeShareInclude2" value="N" onClick="codeShareViewAction(this.value)">
							<label class="custom-control-label" for="codeShareInclude2">제외</label>
						</div>
					</li>
				</ul>
			</div>
		</div>

	</div>
	<!--//셀렉박스-->

	<div class="aq_btn_new">
		<button class="btnReservation borderNone btnReservationV2" id="reSearchButton" style="display:none">
			검색을 다시 해주세요!
		</button>
		<button class="btnReservation btnReservationV2" onClick="return reserveConfirm (event)" id="revButton" style="display:none">
			예약하기
		</button>
		<button class="btnRule btnReservationV2" onClick="return ruleView ('')" id="ruleButton" style="display:none">
			규정보기
		</button>
	</div>