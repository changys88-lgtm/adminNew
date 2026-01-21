			<div class="seat-layer" style="display:none;">
				<div class="layer-head">
					<strong>인원 선택</strong>
					<button class="layer-close"  id="seat-close" onClick="seatClose()">×</button>
					</div>
				<div class="counter-wrap">
					<div class="counter-item">
						<div class="label-con">
							<span class="count-label">성인</span>
							<span class="count-desc">(만 12세 이상)</span>
						</div>	
						<div class="pord_count_btn">
							<div class="count_btn_area">
								<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('adt','-')"></button>
								<input type="number" class="inp_num" id="adt2" readonly="" value="1">
								<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('adt','+')"></button>
							</div>
						</div>
					</div>
					<div class="counter-item">
						<div class="label-con">
							<span class="count-label">소아</span>
							<span class="count-desc">(2 ~ 12세)</span>
						</div>	
						<div class="pord_count_btn">
							<div class="count_btn_area">
								<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('chd','-')"></button>
								<input type="number" class="inp_num" id="chd2" readonly="" value="0">
								<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('chd','+')"></button>
							</div>
						</div>
					</div>
					<div class="counter-item">
						<div class="label-con">
							<span class="count-label">유아</span>
							<span class="count-desc">(만 2세 미만)</span>
						</div>	
						<div class="pord_count_btn">
							<div class="count_btn_area">
								<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('inf','-')"></button>
								<input type="number" class="inp_num" id="inf2" readonly="" value="0">
								<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('inf','+')"></button>
							</div>
						</div>
					</div>
				</div>
				<p class="alert-notice" style="text-align:center">성인, 아동, 유아의 나이는 탑승일 기준입니다.</p>
				<div class="radio-area seat-item">
					<div> 
						<label class="seat-block  whp20 is-checked" ID="Seat_Y" onClick="cabinChange('Y')">
							<a href="#none" class="radio-txt">성인</a>
						</label>
						<label class="seat-block  whp20 lm6" ID="Seat_STU" onClick="cabinChange('STU')">
							<a href="#none" class="radio-txt">학생</a>
						</label>
						<label class="seat-block  whp33 lm6" ID="Seat_LBR" onClick="cabinChange('LBR')">
							<a href="#none" class="radio-txt font15">외국인근로자</a>
						</label>
						<label class=" seat-block  whp20 lm6" ID="Seat_VFR" onClick="cabinChange('VFR')">
							<a href="#none" class="radio-txt font15">다문화</a>
						</label>
						<span class="cored none">* 외국인근로자는 CZ(짐2개) 만 검색가능</span>
					</div>

					<label class="seat-block is-checked2"  onClick="seatClose()">
						<a href="#none" class="radio-txt">확인</a>
					</label>
				</div>
				<!--
				<img src="../images/close_img.png" id="seat-close" onClick="$('.seat-layer').hide()">
				-->
			</div>