            <div style="display:none; position: absolute; right: 0px; top:20px; width:700px" ID="beforeSearch" class="detail-option">
                    <div style="padding:0 10px 5px;" class="opt-row">
                        <div class="opt-check">
                            <input type="checkbox" name="CacheIgnore" id="CacheIgnore" value="Y" >
                            <label for="CacheIgnore">검색 데이터 초기화(캐시초기화)</label>
                        </div>
                    </div>
                    <div>
                        <div  class="opt-group">
                            <div class="opt-inline">
                                <div class="opt-title">검색코드기준</div>
                                <div  class="opt-radio">
                                    <input type="radio" name="SearchPortData" id="SearchPortData_1" checked value="" ><label for="SearchPortData_1">도시및 공항코드 동시 검색</label>
                                </div>
                                <div  class="opt-radio">
                                    <input type="radio" name="SearchPortData" id="SearchPortData_2" value="P" ><label for="SearchPortData_2">공항코드만 검색</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:10px;">
                        <div class="opt-group">
                            <div class="opt-title">선호항공사</div>
                            <div class="opt-check" style="padding-left:13px;">
                                <input type="checkbox" name="SearchAirLikeData"  checked id="SearchAirLikeData_ALL" value="" onClick="return searchAirLikeChange(this.value)"><label for="SearchAirLikeData_ALL">전체항공사</label>
                            </div>
                        </div>
                        <div id="SearchAirLike"><!--8개씩 줄이 들어가게 css처리-->
                            
                            <!--직접입력인풋-->
                            <div>
                                <input type="checkbox" name="" id="" value="" ><label for=""><input type="text" name="" readonly placeholder="지역선택"></label>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:10px;">
                        <div class="opt-group">
                            <div class="opt-title">최대운항시간</div>
                            <div class="opt-inline">
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxJourneyTimeData"  checked id="SearchMaxJourneyTimeData_ALL" value="" ><label for="SearchMaxJourneyTimeData_ALL">전체시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxJourneyTimeData" id="SearchMaxJourneyTimeData_06" value="06" ><label for="SearchMaxJourneyTimeData_06">6시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxJourneyTimeData" id="SearchMaxJourneyTimeData_12" value="12" ><label for="SearchMaxJourneyTimeData_12">12시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxJourneyTimeData" id="SearchMaxJourneyTimeData_24" value="24" ><label for="SearchMaxJourneyTimeData_24">24시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxJourneyTimeData" id="SearchMaxJourneyTimeData_36" value="36" ><label for="SearchMaxJourneyTimeData_36">36시간</label>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:10px;">
                        <div class="opt-group">
                            <div class="opt-title">최대경유시간</div>
                            <div class="opt-inline">
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxShareTimeData"  checked id="SearchMaxShareTimeData_ALL" value="" ><label for="SearchMaxShareTimeData_ALL">전체시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxShareTimeData" id="SearchMaxShareTimeData_03" value="03" ><label for="SearchMaxShareTimeData_03">3시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxShareTimeData" id="SearchMaxShareTimeData_06" value="06" ><label for="SearchMaxShareTimeData_06">6시간</label>
                            </div>
                            <div>
                                <input class="opt-radio" type="radio" name="SearchMaxShareTimeData" id="SearchMaxShareTimeData_09" value="09" ><label for="SearchMaxShareTimeData_09">9시간</label>
                            </div>
                            <div >
                                <input class="opt-radio" type="radio" name="SearchMaxShareTimeData" id="SearchMaxShareTimeData_12" value="12" ><label for="SearchMaxShareTimeData_12">12시간</label>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div style="margin-top:10px;">
                        <div class="opt-group">
                            <div class="opt-title">경유지
                            <span class="opt-sub">(장거리 경유 노선 검색시 유용함)</span>
                            </div>
                            <div class="opt-check">
                                <input type="checkbox" type="checkbox" name="SearchCityLikeData"  checked id="SearchCityLikeData_ALL" value="" onClick="return searchCityLikeChange(this.value)"><label for="SearchCityLikeData_ALL">전체지역</label>
                            </div>
                        </div>
                        <div id="SearchCityLike" class="opt-grid opt-grid-6"><!--6개씩 줄이 들어가게 css처리-->
                            <!--직접입력인풋-->
                            <div class="opt-item">
                                <input type="checkbox" name="" id="" value="" ><label for=""><input type="text" name="" readonly placeholder="지역선택"></label>
                            </div>
                        </div>
                    </div>
                <div  class="opt-footer">
                    <button type="button" onclick="$('#beforeSearch').hide();">닫기</button>
                </div>
            </div>
        