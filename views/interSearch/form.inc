
		<input type="hidden" name="uid"            value="">
		<input type="hidden" name="ticket_type"    value="2">
		<input type="hidden" name="departure"      value="ICN">
		<input type="hidden" name="arrive"         value="">
		<input type="hidden" name="dep_city1"      value="">
		<input type="hidden" name="arr_city1"      value="">
		<input type="hidden" name="dep_city2"      value="">
		<input type="hidden" name="arr_city2"      value="">
		<input type="hidden" name="dep_city3"      value="">
		<input type="hidden" name="arr_city3"      value="">
		<input type="hidden" name="dep_city4"      value="">
		<input type="hidden" name="arr_city4"      value="">
		<input type="hidden" name="dep_city5"      value="">
		<input type="hidden" name="arr_city5"      value="">
		<input type="hidden" name="dep_city6"      value="">
		<input type="hidden" name="arr_city6"      value="">

		<input type="hidden" name="departure2"     value="">
		<input type="hidden" name="arrive2"        value="">
		<input type="hidden" name="maxUid"         value="">
		<input type="hidden" name="TraceId"        value="">

		<input type="hidden" name="departure_date" value="">
		<input type="hidden" name="arrive_date"    value="">

		<input type="hidden" name="RouteCount"     value="2"> <!-- 다구간 전용 -->

		<input type="hidden" name="issue_comm1"    value="0">
		<input type="hidden" name="issue_comm2"    value="0">
		<input type="hidden" name="issueComm"      value="0">
		<input type="hidden" name="issueComm1"     value="0"> <!-- adt -->
		<input type="hidden" name="issueComm2"     value="0"> <!-- chd -->
		<input type="hidden" name="issueComm3"     value="0"> <!-- inf -->
		<input type="hidden" name="issueCommSite"  value="0">
		
		<input type="hidden" name="baggage1"       value="">
		<input type="hidden" name="baggage2"       value="">

		<input type="hidden" name="partnerComm1"   value="">
		<input type="hidden" name="partnerComm2"   value="">
		<input type="hidden" name="max_member"     value="4">

		<input type="hidden" name="adult_price"    value="0">
		<input type="hidden" name="child_price"    value="0">
		<input type="hidden" name="infant_price"   value="0">
		<input type="hidden" name="atr_yes"        value="">

		<input type="hidden" name="adult_tax"      value="0">
		<input type="hidden" name="child_tax"      value="0">
		<input type="hidden" name="infant_tax"     value="0">

		<input type="hidden" name="TotalPrice"     value="">

		<input type="hidden" name="adt"            value="1">
		<input type="hidden" name="chd"            value="0">
		<input type="hidden" name="inf"            value="0">

		<input type="hidden" name="customPrice"    value="0"> <!-- 항공 판매 금액 기록용 -->

		<input type="hidden" name="grade"          value="Y">
		<input type="hidden" name="addCityCode"    value="">

		<input type="hidden" name="departure_date_name" value="">
		<input type="hidden" name="arrive_date_name"    value="">

		<input type="hidden" name="depCheck"       value="">
		<input type="hidden" name="arrCheck"       value="">

		<input type="hidden" name="depCount"       value="">
		<input type="hidden" name="arrCount"       value="">

		<input type="hidden" name="totalAir"       value="">

		<input type="hidden" name="bspSiteCode"    value="">
		<input type="hidden" name="nextKey"        value="1">
		
		<input type="hidden" name="Price_Key"      value="">

		<input type="hidden" name="adtAddAmt"      value="0">
		<input type="hidden" name="chdAddAmt"      value="0">
		<input type="hidden" name="infAddAmt"      value="0">
		<input type='hidden' name='tripKey7'       value=''>

		<input type='hidden' name='beforeAir'      value=''>
		<input type='hidden' name='beforeAir2'     value=''>

		<input type='hidden' name='uniqIdx'        value=''>
		<input type='hidden' name='AccountCode'    value=''>

		
		
		<% 
		for (let rCnt = 1; rCnt < 5 ; rCnt ++) { 
			//if (rCnt == "1") {
			//	$date    = StrClear($dep_date);
			//	$tripKey = 1;
			//} else {
			//	$date    = "";
			//	$tripKey = "";
			//}
		%>
		
				<input type='hidden' name='dep_date<%= rCnt %>'      value=''>
				<input type='hidden' name='depCount<%= rCnt %>'      value=''>
				<input type='hidden' name='depCheck<%= rCnt %>'      value=''>
				<input type='hidden' name='tripKey<%= rCnt %>'       value=''>
				<input type='hidden' name='SelRadio<%= rCnt %>'      value=''>
				<input type='hidden' name='Child<%= rCnt %>'         value=''>
				<input type='hidden' name='Kid<%= rCnt %>'           value=''>
				<input type='hidden' name='Infant<%= rCnt %>'        value=''>
				<input type='hidden' name='DestName<%= rCnt %>'      value=''>
				<input type='hidden' name='airCityName<%= rCnt %>'   value=''>
				<input type='hidden' name='airCabin<%= rCnt %>'      value='Y'>
				<input type='hidden' name='BrandTier<%= rCnt %>'     value=''>
		
		<% } %>
		<% for (let rCnt = 1; rCnt < 9 ; rCnt ++) { %>
				<input type='hidden' name='airSeg<%= rCnt %>'             value=''>
				<input type='hidden' name='OperatingAirline<%= rCnt %>'   value=''>
				<input type='hidden' name='DepartureTime<%= rCnt %>'      value=''>
				<input type='hidden' name='ArriveTime<%= rCnt %>'         value=''>

				<input type='hidden' name='DepTerminal<%= rCnt %>'        value=''>
				<input type='hidden' name='ArrTerminal<%= rCnt %>'        value=''>

				<input type='hidden' name='airCode<%= rCnt %>'            value=''>
				<input type='hidden' name='airName<%= rCnt %>'            value=''>
				<input type='hidden' name='airClass<%= rCnt %>'           value=''>
				<input type='hidden' name='airTime<%= rCnt %>_1'          value=''>
				<input type='hidden' name='airTime<%= rCnt %>_2'          value=''>
				<input type='hidden' name='airEquip<%= rCnt %>'           value=''>
				<input type='hidden' name='airFltTm<%= rCnt %>'           value=''>
				<input type='hidden' name='airPrice<%= rCnt %>'           value=''>
				<input type='hidden' name='airRule<%= rCnt %>'            value=''>
				
				<input type='hidden' name='depCity<%= rCnt %>'            value=''>
				<input type='hidden' name='arrCity<%= rCnt %>'            value=''>
				<input type='hidden' name='Farebasis<%= rCnt %>'          value=''>
				<input type='hidden' name='Groups<%= rCnt %>'             value=''>

				<input type='hidden' name='Cabin<%= rCnt %>'              value=''>
				<input type='hidden' name='Baggage<%= rCnt %>'            value=''>
				<input type='hidden' name='AvailCount<%= rCnt %>'         value=''>

				<input type='hidden' name='Distance<%= rCnt %>'           value=''>
		<% } %>
		