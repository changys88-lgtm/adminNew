                    <div class="seat-layer" style="display:none;     position: absolute;	top: 40px;	left: 20px;height:455px;">
						<div class="counter-wrap">
							<div class="counter-item">
								<div class="label-con">
									<span class="count-label">성인</span>
									<span class="count-desc">(만 12세 이상)</span>
								</div>	
								<div class="pord_count_btn">
									<div class="count_btn_area">
										<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('adtMem','-')"></button>
										<input type="number" class="inp_num" id="adtMem2" readonly="" value="1">
										<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('adtMem','+')"></button>
									</div>
								</div>
							</div>
							<div class="counter-item">
								<div class="label-con">
									<span class="count-label">아동</span>
									<span class="count-desc">(만 2 - 12세)</span>
								</div>	
								<div class="pord_count_btn">
									<div class="count_btn_area">
										<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('chdMem','-')"></button>
										<input type="number" class="inp_num" id="chdMem2" readonly="" value="0">
										<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('chdMem','+')"></button>
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
										<button type="button" class="ico_typ btn_minus" value="-" onClick="paxChange ('infMem','-')"></button>
										<input type="number" class="inp_num" id="infMem2" readonly="" value="0">
										<button type="button" class="ico_typ btn_plus" value="+" onClick="paxChange ('infMem','+')"></button>
									</div>
								</div>
							</div>
						</div>
						<p class="alert-notice" style="text-align:center">성인, 아동, 유아의 나이는 탑승일 기준입니다.</p>
						<div class="radio-area seat-item">
							<div>
								<label class="seat-block is-checked" ID="Seat_Y" onClick="cabinChange('Y')">
									<a href="#none" class="radio-txt">일반석</a>
								</label>
								<label class="seat-block" ID="Seat_C" onClick="cabinChange('C')">
									<a href="#none" class="radio-txt">비즈니스석</a>
								</label>
							</div>
							<label class="seat-block is-checked2"  onClick="seatClose()">
								<a href="#none" class="radio-txt">확인</a>
							</label>
						</div>
						<img src="../images/close_img.png" id="seat-close">
					</div>