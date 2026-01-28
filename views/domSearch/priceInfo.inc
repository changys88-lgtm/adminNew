<div class="air-page-quickbar" style="margin-right:25px">
    <!--
    <div class="map_search" onclick="searchAction () ">
        <i class="fa fa-search search_icon"></i>검색
    </div>
    -->
    <!--선택정보확인-->
    <div class="aq-box">
        <div class="aq-top">
            선택한 항공편
        </div>
        <div class="aq-body">
            <div class="item-1">
                <p class="f1">
                    <span class="s1">[가는편]</span>
                    <span class="s2" id="depAirNameR"></span>
                    <span class="s3">잔여(<span style="color:#ff0;" id="depReaminR">0</span>석)</span>
                </p>
                <div class="wt-box">
                    <span class="qb-item">
                        <span>구간</span><span class="tkt-way" id="depNameR"></span>
                    </span>
                    <span class="qb-item">
                        <span>출발일시</span><span class="tkt-way" id="depDateR"></span>
                    </span>
                    <span class="qb-item">
                        <span>편명</span><span class="tkt-way" id="depAirFlightR"></span>
                    </span>
                    <span class="qb-item">
                        <span>소계<span class="s1">(성인 1인기준)</span></span><span class="tkt-way" id="depPriceR"></span>
                    </span>
                </div>
            </div>
            <div class="item-1">
                <p class="f1">
                    <span class="s1">[오는편]</span>
                    <span class="s2" id="arrAirNameR"></span>
                    <span class="s3">잔여(<span style="color:#ff0;" id="arrReaminR">0</span>석)</span>
                </p>
                <div class="wt-box">
                    <span class="qb-item">
                        <span>구간</span><span class="tkt-way" id="arrNameR"></span>
                    </span>
                    <span class="qb-item">
                        <span>출발일시</span><span class="tkt-way" id="arrDateR"></span>
                    </span>
                    <span class="qb-item">
                        <span>편명</span><span class="tkt-way" id="arrAirFlightR"></span>
                    </span>
                    <span class="qb-item">
                        <span>소계<span class="s1">(성인 1인기준)</span></span><span class="tkt-way" id="arrPriceR"></span>
                    </span>
                </div>
            </div>
            
            <div class="item-1">
                <div class="wt-box" id="adtArea">
                    <span class="qb-item cnt">
                        성인<span id="adtMemR"> 1</span>명<span class="tkt-way" id="adtPriceR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>운임</span><span class="tkt-way" id="adtAirPriceR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>유류할증료</span><span class="tkt-way" id="adtAirFuelR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>세금</span><span class="tkt-way" id="adtAirTaxR">0원</span>
                    </span>
                </div>
                <div class="wt-box" id="chdArea" style="display:none">
                    <span class="qb-item cnt">
                        소아<span id="chdMemR"> 0</span>명<span class="tkt-way" id="chdPriceR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>운임</span><span class="tkt-way" id="chdAirPriceR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>유류할증료</span><span class="tkt-way" id="chdAirFuelR">0원</span>
                    </span>
                    <span class="qb-item">
                        <span>세금</span><span class="tkt-way" id="chdAirTaxR">0원</span>
                    </span>
                </div>
                <div class="wt-box" id="infArea" style="display:none">
                    <span class="qb-item cnt">
                        유아<span id="infMemR"> 1</span>명<span class="tkt-way" id="infPriceR">무임</span>
                    </span>
                </div>
            </div>
            <div class="item-1" style="border-bottom:none;">
                <div class="wt-box">
                    <span class="qb-item " title="타스프 금액은 성인/소아 1인 기준입니다.">
                        <span>마크업(Tasf)/인당</span><span class="sum"><input type="text" class="d-inline wh70 ar"  name="tasfDome" id="tasfDome" onChange="return tasfChange()" value="0">원</span>
                    </span>
                    <span class="qb-item">
                        <span>총 결제금액</span><span class="sum" id="TotalAmount">0원</span>
                    </span>
                </div>
            </div>
        </div>
        <div class="aq_btn" id="reserveButton" onClick="return airConfirm ()" style="display:none">
            예약하기
        </div>
        
    </div>
</div>