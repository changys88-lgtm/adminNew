<?
include "../include/top.1.1.php";
include "../lib/config.php";

if ($uid != "") {
	$sql = "select * from tblNotice where uid = '$uid' ";
	$row = sqlQueryArray($sql);
	$read1 = "readonly";
}
?>
<script type="text/javascript" src="../SmartEditor/js/HuskyEZCreator.js" charset="utf-8"></script>
<SCRIPT LANGUAGE="JavaScript">
<!--
	function inputCheck () {
		Obj = document.frmForm;
		sContents =  showHTML();
		Obj.sContents.value = sContents;
		if (sContents == "") {
			alert("본문을 입력하세요");
		} else if (Obj.sTitle.value == "") {
			alert("제목을 입력하세요");
		} else {
			Obj.submit();
		}
		return false;
	}
//-->
</SCRIPT>

<div class="pop" style="width:100%">
  <h1 class="pop_top">공지사항 등록및 수정</h1>


		<form name="frmForm" action="../bbs/notice_save.php" enctype="multipart/form-data" method="post">
		<input type=hidden name=mode value="<?=$mode?>">
		<input type=hidden name=uid value="<?=$uid?>">
		<textarea name="sContents" style="display:none"><?=$row[sContents]?></textarea>
		<table class="tbl_type"  border="0" cellpadding="0" cellspacing="0" width="100%" >
			<tr>
				<th scope="row">제목</th>
				<td colspan=3><input type="text" class="input01 " style='width:95%' name="sTitle" value="<?=$row[sTitle]?>"  ></td>
			</tr>
			<tr>
				<th >등록일</th>
				<td ><input type=text class='input01' style='width:95%' name='dDate' value='<?=CutDateTime($row[dDate])?>' ></td>
				<th>조회수</th>
				<td><input type=text class='input01' style='width:40px' name='iReadCount' value='<?=$row[iReadCount]?>'></td>
			</tr>
			<tr>
				<th >분류</th>
				<td >
					<select name="sGubun">
						<option value=''>선택하세요
						<?
						foreach ($arrayNoticeGubun as $key => $val) {
							if ($row[sGubun] == $key) $s = "selected"; else $s = "";
							echo "<option value='$key' $s>$val";
						}
						?>
					</select>
				</td>
				<th>작성자</th>
				<td><input type=text class='input01' style='width:100px' name='sWriter' value='<?=$row[sWriter]?>'></td>
			</tr>
			<tr>
				<td colspan=4 align=center>
		<textarea name="ir1" id="ir1" rows="10" cols="100" style="width:760px; height:350px; display:;"></textarea>
				</td>
			</tr>
			<tr>
				<td colspan=4 align=center height=40>
					<a href='javascript://' class='btn_org' onClick="return inputCheck()"><strong>저장</strong></a>
					<a href='javascript://' class='btn_gry' onClick="window.close()"><strong>창닫기</strong></a>
				</td>
			</tr>

		</table>
		
		</form>

	</div>
</body>
<? include "../include/bottom.php"; ?>
<script type="text/javascript">
posi = "<?=$posi?>";
gubun = "<?=$gubun?>";
var oEditors = [];

// 추가 글꼴 목록
//var aAdditionalFontSet = [["MS UI Gothic", "MS UI Gothic"], ["Comic Sans MS", "Comic Sans MS"],["TEST","TEST"]];

nhn.husky.EZCreator.createInIFrame({
	oAppRef: oEditors,
	elPlaceHolder: "ir1",
	sSkinURI: "SmartEditor2Skin.html",	
	htParams : {
		bUseToolbar : true,				// 툴바 사용 여부 (true:사용/ false:사용하지 않음)
		bUseVerticalResizer : true,		// 입력창 크기 조절바 사용 여부 (true:사용/ false:사용하지 않음)
		bUseModeChanger : true,			// 모드 탭(Editor | HTML | TEXT) 사용 여부 (true:사용/ false:사용하지 않음)
		//aAdditionalFontList : aAdditionalFontSet,		// 추가 글꼴 목록
		fOnBeforeUnload : function(){
			//alert("완료!");
		}
	}, //boolean
	fOnAppLoad : function(){
		//예제 코드
		//oEditors.getById["ir1"].exec("PASTE_HTML", ["로딩이 완료된 후에 본문에 삽입되는 text입니다."]);
	},
	fCreator: "createSEditor2"
});

function pasteHTML(val) {
	//var sHTML = "<span style='color:#FF0000;'>이미지도 같은 방식으로 삽입합니다.<\/span>";
	//var sHTML = "12345677";
	oEditors.getById["ir1"].exec("PASTE_HTML", [val]);
}

function showHTML() {
	var sHTML = oEditors.getById["ir1"].getIR();
	return sHTML;
}
	
function submitContents(elClickedObj) {
	oEditors.getById["ir1"].exec("UPDATE_CONTENTS_FIELD", []);	// 에디터의 내용이 textarea에 적용됩니다.
	
	// 에디터의 내용에 대한 값 검증은 이곳에서 document.getElementById("ir1").value를 이용해서 처리하면 됩니다.
	
	try {
		elClickedObj.form.submit();
	} catch(e) {}
}

function setDefaultFont() {
	var sDefaultFont = '궁서';
	var nFontSize = 24;
	oEditors.getById["ir1"].setDefaultFont(sDefaultFont, nFontSize);
}
function Finish() {
	setTimeout("onInsert()",1000);
}
function onInsert() {
	val = document.frmForm.sContents.value;
	pasteHTML(val);
}
window.onload=Finish;
</script>

</body>
</html>