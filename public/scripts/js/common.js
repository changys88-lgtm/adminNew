// Left Menu, scroll Fix
$(window).scroll(function() {
    if($(window).scrollTop() > 146) {
        $('.navFix').css({'position':'fixed', 'top':0});
    }
    else {
        $('.navFix').css({'position':'absolute', 'top':'145px'});
    }
});

// Board Left 메뉴
$('.navFix .spread .btnLeft').click(function() {
    if($(this).hasClass('on')) {
        $(this).removeClass('on').html('<img src="../images/arrow-right-long-solid.svg" alt="열기">');
        $('.navFix').removeClass('on');
        $('#content').removeClass('active');
    }
    else {
        $(this).addClass('on').html('<img src="../images/arrow-left-long-solid.svg" alt="접기">');
        $('.navFix').addClass('on');
        $('#content').addClass('active');
    }
});


// function some(oo){
//     alert(this.value)
// }