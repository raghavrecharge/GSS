/***************************************************
==================== JS INDEX ======================
****************************************************
01. PreLoader Js
02. Nice Select Js
03. mobile menu Js
04. Sticky Header Js
05. offcanvas
06. Common Js
07. back-to-top
08. magnificPopup img view
09. Counter Js
10. Wow Js
11. Search Js
12. tp-header-top-currency-toggle
13. Scroll nav class add
14. Show more/ Show less js
14. Password Toggle Js
15. E-commerce plus minus js
****************************************************/

(function ($) {
	"use strict";

	var windowOn = $(window);

	////////////////////////////////////////////////////
	// 01. PreLoader Js
	windowOn.on('load', function () {
		$(".preloader").fadeOut(500);
		wowAnimation();
	});


	// 02. Nice Select Js
	$('.tp-select').niceSelect();

	////////////////////////////////////////////////////
	// 03. mobile menu Js
    let tpMenuHTML = $('.tp-mobile-menu-active > ul').clone();
    let tpOffcanvasMenu = $('.tp-offcanvas-menu > nav');

    tpOffcanvasMenu.append(tpMenuHTML);

    if($(tpOffcanvasMenu).find('.sub-menu').length != 0){
      $(tpOffcanvasMenu).find('.sub-menu').parent().append('<button class="tp-sidemenu-close"><i class="fas fa-chevron-right"></i></button>');
    }
    
    let tpSideMenuToggle = $('button.tp-sidemenu-close');

    $(tpSideMenuToggle).on('click',function(){
        $(this).siblings('.sub-menu').slideToggle();
        $(this).parent().toggleClass('active');
    });

	///////////////////////////////////////////////////
	// 04. Sticky Header Js
	windowOn.on('scroll', function () {
		let scroll = windowOn.scrollTop();
		if (scroll < 20) {
			$("#header-sticky").removeClass("header-sticky");
		} else {
			$("#header-sticky").addClass("header-sticky");
		}
	});

	if ($('.tp-header-height').length > 0) {
        var headerHeight = document.querySelector(".tp-header-height");
        var setHeaderHeight = headerHeight.offsetHeight;

        $(".tp-header-height").each(function () {
            $(this).css({
                'height': setHeaderHeight + 'px'
            });
        });
    }


	////////////////////////////////////////////////////
	// 05. offcanvas

	$(".tp-header-toogle").on('click',function(){
        $(".tp-offcanvas").addClass("tp-offcanvas-open");
        $(".tp-offcanvas-overlay").addClass("tp-offcanvas-overlay-open");
    });

    $(".tp-offcanvas-close-button,.tp-offcanvas-overlay").on('click',function(){
        $(".tp-offcanvas").removeClass("tp-offcanvas-open");
        $(".tp-offcanvas-overlay").removeClass("tp-offcanvas-overlay-open");
    });
	$('.tp-faq-button').on('click', function() {
        $('.tp-faq-item').removeClass('active');
        $(this).closest('.tp-faq-item').addClass('active');
    });

	$(".cartmini-open-btn").on("click", function () {
		$(".cartmini__area").addClass("cartmini-opened");
		$(".tp-offcanvas-overlay").addClass("tp-offcanvas-overlay-open");
	});
  
	$(".cartmini-close-btn,.tp-offcanvas-overlay").on("click", function () {
		$(".cartmini__area").removeClass("tp-offcanvas-overlay-open cartmini-opened");
		$(".tp-offcanvas-overlay").removeClass("tp-offcanvas-overlay-open");
	});

	////////////////////////////////////////////////////
	// 06. Common Js
	$("[data-background").each(function () {
		$(this).css("background-image", "url( " + $(this).attr("data-background") + "  )");
	});

	$("[data-width]").each(function () {
		$(this).css("width", $(this).attr("data-width"));
	});

	$("[data-bg-color]").each(function () {
		$(this).css("background-color", $(this).attr("data-bg-color"));
	});


	////////////////////////////////////////////////////
	// 07. back-to-top
	function back_to_top() {
		var btn = $('#back_to_top');
		var btn_wrapper = $('.back-to-top-wrapper');

		windowOn.scroll(function () {
			if (windowOn.scrollTop() > 300) {
				btn_wrapper.addClass('back-to-top-btn-show');
			} else {
				btn_wrapper.removeClass('back-to-top-btn-show');
			}
		});

		btn.on('click', function (e) {
			e.preventDefault();
			$('html, body').animate({ scrollTop: 0 }, '300');
		});
	}
	back_to_top();

	////////////////////////////////////////////////////
	// 08. magnificPopup img view
	$('.popup-image').magnificPopup({
		type: 'image',
		gallery: {
			enabled: true
		}
	});

	$(".popup-video").magnificPopup({
		type: "iframe",
	});

	////////////////////////////////////////////////////
	// 09. Counter Js
	new PureCounter();
	new PureCounter({
		filesizing: true,
		selector: ".filesizecount",
		pulse: 2,
	});


	////////////////////////////////////////////////////
	// 10. Wow Js
    function wowAnimation() {
        var wow = new WOW({
            boxClass: 'wow',
            animateClass: 'animated',
            offset: 0,
            mobile: false,
            live: true
        });
        wow.init();
    }


	///////////////////////////////////////////////////
	// 11. Search Js

	$(".tp-search-click").on("click", function () {
		$(".tp-search-form-toggle").addClass("active");
		$(".tp-offcanvas-overlay").addClass("tp-offcanvas-overlay-open");
	});

	$(".tp-search-close,.tp-offcanvas-overlay").on("click", function () {
		$(".tp-search-form-toggle").removeClass("active");
		$(".tp-offcanvas-overlay").removeClass("tp-offcanvas-overlay-open");
	});

	/////////////////////////////////////////////////////
  	// 12. tp-header-top-currency-toggle
	if ($("#tp-header-currency-toggle").length) {
		windowOn.on('click', function (e) {
			if ($("#tp-header-currency-toggle").has(e.target).length || $("#tp-header-currency-toggle")[0] === e.target) {
				$(".tp-header-currency ul").toggleClass("tp-header-currency-list-open");
			} else {
				$(".tp-header-currency ul").removeClass("tp-header-currency-list-open");
			}
		});
	}

	/////////////////////////////////////////////
	// 13. Scroll nav class add
	if($('#course_details2_nav').length > 0){
		$(document).ready(function() {
			$('#course_details2_nav').onePageNav();
		});
	}

	////////////////////////////////////////
	// 14. Show more/ Show less js
	if($('.show-more-button').length > 0){
		document.addEventListener('DOMContentLoaded', function () {
			const showMoreButton = document.querySelector('.show-more-button');
			const content = document.querySelector('.content');
	
			showMoreButton.addEventListener('click', function () {
				const svgIcon = showMoreButton.querySelector('.svg-icon');
				if (content.classList.contains('show')) {
					content.classList.remove('show');
					showMoreButton.innerHTML = '';
					svgIcon.innerHTML = `
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6 1V11" stroke="#3C66F9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							<path d="M1 6H11" stroke="#3C66F9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					`;
					showMoreButton.appendChild(svgIcon);
					showMoreButton.append('Show more');
				} else {
					content.classList.add('show');
					showMoreButton.innerHTML = '';
					svgIcon.innerHTML = `
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M1 6H11" stroke="#3C66F9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					`;
					showMoreButton.appendChild(svgIcon);
					showMoreButton.append('Show less');
				}
			});
		});
	}

	$(document).ready(function () {
		$(".tp-filter-d").on("click", function () {
			$(".tp-filter-dropdown-wrapper-2").slideToggle(300);
		});
	});


	////////////////////////////////////////////////////
	// 14. Password Toggle Js
	if($('.password-show-toggle').length > 0){

		var showBtn = $('.password-show-toggle');

		showBtn.each(function (e) {
			$(this).on('click', function(x){
				let inputField = $(this).parent().find('input');
				if(inputField.attr('type') === "password"){
					inputField.attr('type', 'text')
					$(this).children('.open-eye-icon').css({
						'display' : 'block'
					})
					$(this).children('.close-eye-icon').css({
						'display' : 'none'
					})
				}else{
					inputField.attr('type', 'password')
					$(this).children('.open-eye-icon').css({
						'display' : 'none'
					})
					$(this).children('.close-eye-icon').css({
						'display' : 'block'
					})
				}
			})
		})
	}

	///////////////////////////////////////////////////
	// 15. E-commerce plus minus js
	function tp_ecommerce() {
		$('.tp-dreckment,.tp-cart-minus').on('click', function () {
		  const $input = $(this).siblings('input');
		  let count = Number($input.val()) - 1;
		  $input.val(count < 1 ? 0 : count).change();
		});
	  
		$('.tp-increment,.tp-cart-plus').on('click', function () {
		  const $input = $(this).siblings('input');
		  $input.val(Number($input.val()) + 1).change();
		});

		$('.tp-color-variation-btn').on('click', function () {
		  $(this).addClass('active').siblings().removeClass('active');
		});

		//  tpReturnCustomerLoginForm //
		$('.tp-checkout-login-form-reveal-btn').on('click', function () {
			$('#tpReturnCustomerLoginForm').slideToggle(400);
		});
		
		//  Show Coupon Toggle Js //
		$('.tp-checkout-coupon-form-reveal-btn').on('click', function () {
		$('#tpCheckoutCouponForm').slideToggle(400);
		});
	
		// Create An Account Toggle Js //
		$('#cbox').on('click', function () {
			$('#cbox_info').slideToggle(900);
		});
	
		// Shipping Box Toggle Js //
		$('#ship-box').on('click', function () {
			$('#ship-box-info').slideToggle(1000);
		});

	}
	tp_ecommerce();

})(jQuery);