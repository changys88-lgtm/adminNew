        <div id="ageCheckPopup" style="display:none; position:absolute; right:0px; top:20px; width:550px" class="detail-option">
            <div class="detail-top">
                <div class="tit">나이 계산기</div>
                <button type="button" onclick="$('#ageCheckPopup').hide()"></button>
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
                            <input type="text" class=" wh120 ac" name="startDate" onfocus="this.select()" id="startDate" onClick="datePick('startDate')" value="<%= new Date().toISOString().slice(0, 10) %>">
                        </td>
                        <td class="ac">
                            <input type="text" class=" wh120 ac" name="birthDay" onfocus="this.select()" id="birthDay" onClick="datePick('birthDay')" value="<%= new Date().toISOString().slice(0, 10) %>">
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
            </div>

            <div  class="opt-footer">
                <button type="button" onclick="$('#ageCheckPopup').hide()">닫기</button>
            </div>
        </div>