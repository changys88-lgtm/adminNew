        <div style="display:none; position: absolute; right: 0px;" id="ageCheckPopup" class="detail-option">
            <div class="detail-top">
                <li class="tit">나이 계산기</li>
                <li id="datail-close" onclick="$('#ageCheckPopup').hide()"><img src="/images/close.png" width="50"></li>
            </div>

            <div class="detail-content"></div>
            
            <div style="padding:10px 10px">
                <table width="100%" height="160" class="OyeTable bgcEEE">

                    <tbody><tr class="ac">
                        <th>출발일</th>
                        <th>생년월일</th>
                        <th>계산</th>
                    </tr>

                    <tr class="ac">
                        <td class="ac">
                            <input type="text" class="d-inline form-control form-control-sm wh120 ac" name="start_date" onfocus="this.select()" id="start_date" onkeyup="return DateAutoCheck(this)" onblur="return dCheck3(this)" value="2026-01-21">
                        </td>
                        <td class="ac">
                            <input type="text" class="d-inline form-control form-control-sm wh120 ac" name="birthday" onfocus="this.select()" id="birthday" onkeyup="return DateAutoCheck(this)" onblur="return dCheck3(this)" value="2026-01-21">
                        </td>
                        <td>
                            <span class="btn_basic btn_blue" onclick="calculateAge ()">계산하기</span>
                        </td>
                    </tr>

                    <tr class="ac">
                        <td colspan="3">
                            <span style="font-size: 24px;font-weight: 500;">
                                실제 만나이 : 
                                <span id="ageValue">0</span> 세
                            </span>
                        </td>

                    </tr>

                </tbody></table>
            </div>
            
            <div class="detail-content">
            <div class="pal30 al">
                <ul>
                    <li>최종 탑승일을 입력해 주세요
                    </li><li>성인 : 만 12세 이상
                    </li><li>소아 : 2세 부터 12세 미만까지
                    </li><li>유아 : 24개월 미만 
                    </li><li>주민등록및 신분증의 출생일을 직업입력후 계산하여 주세요
                </li></ul>
            </div>
            <div class="detail-content ac" onclick="$('#ageCheckPopup').hide()"> <span class="btn_basic btn_gray">닫 기</span></div>
            </div>
        </div>