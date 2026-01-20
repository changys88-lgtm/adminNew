<%- include('../header') %>

<div id="content" class="whp100 patNot">

	<div class="border regis-tle-box shadow-sm">
		<h5 class="regis-tle">
			<i class="fas fa-edit" style="color:#777;font-size:16px;"></i>&nbsp;&nbsp;항공사 실적 관리   &nbsp;&nbsp;
			<span style="color:#bbb; font-size:14px;" id="totCount">(0) </span>
		</h5>
	</div>

	<form name="frmSearch" id="frmSearch" enctype="multipart/form-data" method="post" onsubmit="return formSearch(event);" >
	<input type="hidden" name="menuCol"   value="">
    <input type="hidden" name="mode"      value="">
	<input type="hidden" name="page"      value="1">
    <input type="hidden" name="GU4"       value="Inter">
    <input type="hidden" name="GU5"       value="DAY">
		<div id="searchFrame">
			<div class="row">
                <div class="col-3">
					<span class="btn_basic btn_gray btn_yellow GU4" id="GU4_Inter" onClick="modeChange('GU4','Inter')">국제선</span>
					<span class="btn_basic btn_gray            GU4" id="GU4_Dome"  onClick="modeChange('GU4','Dome')">국내선</span>
				</div>
				<div class="col-9 mt-3" >
					<div class="row float-right">
						
						<div class="d-inline mr-2">
                            <select name="GU7" class="d-inline form-control form-control-sm"  style='width:90px;' >
                                <option value=""	>전체
                                <option value="1"	>편도
                                <option value="2"	>왕복
                                <option value="3"	>다구간
                            </select>
                        </div>
						<div class="d-inline  mr-2">
                            <select name="GU1" class="d-inline form-control form-control-sm" onchange=" formSearch (event,'1'); ">
                                <option value="ISSUE"	>발권일
                                <option value="DEP"		>출발일
                                <option value="ORDER"	>신청일
                            </select>
                        </div>
                        <div class="d-inline mr-2">
							<span class="d-inline mt-1"></span>
							<input name='start_date' id='start_date' type='text' autocomplete="off" value="<%= new Date().toISOString().slice(0,10) %>" class='d-inline form-control form-control-sm wh100'  onClick="return datePick('start_date')">
							&nbsp;<i class='fas fa-calendar-alt' onClick="return datePick('start_date')" style='color:#555;'></i>
							
						</div>
						<div class="d-inline mr-3">
							<span class="d-inline mt-1"></i></span>
							<input name='end_date' id='end_date' type='text' autocomplete="off" value="<%= new Date().toISOString().slice(0,10) %>" class='d-inline form-control form-control-sm wh100' onClick="return datePick('end_date')">
							&nbsp;<i class='fas fa-calendar-alt' onClick="return datePick('end_date')" style='color:#555;'></i>
							
						</div>	
						
						<div class="d-inline mr-3">
							<div class="input-group">
                                <button class="btn btn-dark" type="submit" style="background-color:#555;" >
                                    <i class="fa fa-search"></i>
                                </button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</form>

	<form name="frmForm" method="post" id="frmForm">
	<input type="hidden" name="uid"  value="">
	<input type="hidden" name="mode" value="">
	<div ID="listFrame" >
		<div ID="listFrameSub" >
			<table class='table table-light text-center mt-3' bordercolor='#ddd' style="border-bottom:1px solid #ddd;" id='dtBasic'>
				<tr style="background-color:#eee;">
                    <tr style="background-color:#eee;">
                        <th class='border-bottom-0'>No</th>
                        <th class='border-bottom-0'>구분자</th>
                        <th class='border-bottom-0'>수량</th>
                        <th class='border-bottom-0'>퍼스트</th>
                        <th class='border-bottom-0'>비지니스</th>
                        <th class='border-bottom-0'>일반석</th>
                        <th class='border-bottom-0'>판매가</th>
                        <th class='border-bottom-0'>입금가</th>
                        <th class='border-bottom-0'>택스</th>
                        <th class='border-bottom-0'>Galileo</th>
                        <th class='border-bottom-0'>Sabre</th>
                        <th class='border-bottom-0'>Sell</th>
                        <th class='border-bottom-0'>Etc</th>
                        <th class='border-bottom-0'>Void</th>
                    </tr>
				</tr>
			</table>
		</div>
	</div>
	</form>
	<div style="clear:both;" ID="bottomFrame">

		<div class="whp33 fl">
			&nbsp;
			
		</div>
		<div class="whp33 fl ac" ID="pagingHTML">
		</div>
		<div class="row float-right mr-0 fr">			
			<button class="btn_basic btn-gray "     href="javascript://" onClick="return excelDown()" >엑셀다운</button>
		</div>
		
	</div>

</div>
<form name="frmModify" id="frmModify" method="post" >
	<input type="hidden" name="mode"		value="">
	<input type="hidden" name="AccountCode">
	<input type="hidden" name="money_type">
    <input type="hidden" name="gubun_code">

</form>
<div id="basePopUp" style="display:none"></div>
<script type="text/javascript">
<!--

	$(document).ready(function() {
		//frmSearch.submit ();
		formSearch (event,'1');
	});

	async function formSearch (e,page=1) {
        if (e) e.preventDefault();
        frmSearch.page.value = page;
		LoadingStart ();
        json = await dataSaveSend ('frmSearch','/stats/route_list');
		const success = json.success;
		if (success === "ok") {
            const datas  = json.listData;
            const paging = json.pageData;
            $("#listFrameSub").html(datas);
            $("#pagingHTML").html(paging);
            //$("#cYearData").html(json.cYearData);
            //$("#cMonthData").html(json.cMonthData);
            $("#totCount").html(`(${json.totalCount})`);
		} else {
            newAlert('목록호출중 오류 발생');
		}
		LoadingStop();
        return false;
	};

//-->

</script>

<%- include('../footer_log') %>