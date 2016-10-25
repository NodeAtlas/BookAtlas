/*------------------------------------*\
    $%SUMMARY
\*------------------------------------*/

/**
 * SUMMARY.............It's me !
 * GLOBAL..............Define global variables.
 * COMMON..............This functions are used on more one page, and execute on each pages.
 */





/*------------------------------------*\
    $%GLOBAL
\*------------------------------------*/

var website = website || {},
    $window = $(window),
    $html = $("html"),
    $body = $("body"),
    $base = $("base");





/*------------------------------------*\
    $%COMMON
\*------------------------------------*/

(function (publics) {
    "use strict";

    var privates = {},
        optionsSocket;

    optionsSocket = ($body.data('subpath') !== '') ? { path: '/' + $body.data('subpath') + (($body.data('subpath')) ? "/" : "") + 'socket.io' } : undefined;

    publics.socket = io.connect(($body.data('subpath') !== '') ? $body.data('hostname') : undefined, optionsSocket);

    publics.generateEmail = function () {
        $(".generate-email").click(function () {
            var email = "bruno-lesieur_gmail-com";

            email = email.replace(/-/g, ".").replace(/_/g, "@");

            $(this)
                .attr("href", "mailto:" + email)
                .text(email);
        });
    };

    privates.loadSections = function(callback) {
        publics.socket.emit("load-sections", {
            lang: $html.attr('lang'),
            variation: $body.data('variation')
        });
        publics.socket.on("load-sections", function (data) {
            var targetTop = ".top.sections > .return > a",
                targetBottom = ".bottom.sections > .return > a",
                $section;

            function animatedOpenSection($sectionWrap) {
                var $section = $sectionWrap.find("section"),
                    tempHeight = $section;

                $section.css({
                    height: "0"
                }).animate({
                    height: tempHeight
                }, 500, function () {
                    $(this).removeAttr("style");
                });
            }

            for (var i in data.topPart) {
                if (!$(".top.sections > .section > ." + i).length) {
                    $section = $(data.topPart[i]);
                    $(targetTop).parent().after($section);
                    animatedOpenSection($section);
                }
                targetTop = ".top.sections > .section > ." + i;
            }

            for (var i in data.bottomPart) {
                if (!$(".bottom.sections > .section > ." + i).length) {
                    $section = $(data.bottomPart[i]);
                    $(targetBottom).parent().after($section);
                    animatedOpenSection($section);
                }
                targetBottom = ".bottom.sections > .section > ." + i;
            }

            callback();
        });
    };

    publics.activeEditMode = function () {
        $(".toggle.checkbox").click(function () {
            var $this = $(this);

            if (!$this.hasClass("checked")) {
                $this.addClass("checked");
                $this.find("input").prop("checked", true);
                $html.addClass("is-editable");
            } else {
                $this.removeClass("checked");
                $this.find("input").prop("checked", false);
                $html.removeClass("is-editable");
            }
        });
    };

    publics.accountLogin = function () {
        $(".account-login-button").click(function (e) {
            e.preventDefault();

            $(this).addClass("loading");

            var data = {
                email: $("#account-login-email").val(),
                password: $("#account-login-password").val()
            };

            website.socket.emit('account-login', data);
        });
    };

    publics.listeningAccountLogin = function () {
        website.socket.on('account-login', function (data) {
            if (data.authSuccess) {
                location.reload();
            } else {
                $(".account-login-button").removeClass("loading");
                $(".submit .errors ").show();
            }
        });
    };

    publics.accountLogout = function () {
        $(".account-logout-button").click(function (e) {
            if (!website.isEditable) {
                e.preventDefault();

                $(this).addClass("loading");

                website.socket.emit('account-logout', {});
            }
        });
    };

    publics.listeningAccountLogout = function () {
        website.socket.on('account-logout', function (data) {
            location.reload();
        });
    };

    publics.init = function () {
        privates.accountLogin();
        privates.listeningAccountLogin();
        privates.accountLogout();
        privates.listeningAccountLogout();
    };

    publics.init = function () {
        var halfHeight,
            halfHeightPadding,
            $main,
            $topSection,
            $bottomSection;

        privates.loadSections(function () {
            $main = $(".main");
            $topSection = $(".top.sections .section");
            $bottomSection = $(".bottom.sections .section");

            function calcHalfHeight() {
                if (window.matchMedia("(max-width: 323px), (max-height: 500px)").matches) {
                    halfHeight = $window.height();
                    halfHeightPadding = $window.height() - 40;
                } else {
                    halfHeight = $window.height() - ($main.height() * 2);
                    halfHeightPadding = $window.height() - ($main.height() * 2) - 56;
                }
            }

            function closeSection() {
                $topSection.find(".content").css("height", "");
                $bottomSection.find(".content").css("height", "");

                $topSection.removeClass("open");
                $bottomSection.removeClass("open");

                $main.css("bottom", "");
                $main.css("top", "");

                $main.removeClass("to top");
                $main.removeClass("to bottom");
            }

            function openSection($currentSection, current, other, notPushed) {
                if (!$html.hasClass("is-editable")) {
                    if (!notPushed) {
                        history.pushState($currentSection.data("url"), "", "/" + $currentSection.data("url") + "/");
                    }

                    $topSection.removeClass("open").removeClass("start");
                    $bottomSection.removeClass("open").removeClass("start");
                    $currentSection.addClass("open");

                    $main.css(other, "");
                    $main.css(current, halfHeight);

                    $topSection.find(".content").css("height", "");
                    $bottomSection.find(".content").css("height", "");
                    $currentSection.find(".content").css("height", halfHeight);

                    $currentSection.find(".scrollable").css("height", halfHeightPadding);

                    $main.removeClass("to " + current);
                    $main.addClass("to " + other);
                }
            }

            calcHalfHeight();

            $(".return a").click(function (event) {
                event.stopPropagation();
                $html.trigger("click");
            });

             $("h1").click(function (event) {
                if ($(this).parents(".open").length > 0) {
                    event.stopPropagation();
                    $html.trigger("click");
                }
            });

            $html.click(function () {
                history.pushState("", "", "/");
                closeSection();
            }).find(".edit-atlas--popup, .members").click(function() {
                return false;
            });

            $topSection.each(function () {
                var $this = $(this);

                if ($this.hasClass("open")) {
                    $main.css("top", halfHeight);
                    $this.find(".content").css("height", halfHeight);
                    $this.find(".scrollable").css("height", halfHeightPadding);
                }
            }).click(function (event, notPushed) {
                event.stopPropagation();

                openSection($(this), "top", "bottom", notPushed);
            });

            $bottomSection.each(function () {
                var $this = $(this);

                if ($this.hasClass("open")) {
                    $main.css("bottom", halfHeight);
                    $this.find(".content").css("height", halfHeight);
                    $this.find(".scrollable").css("height", halfHeightPadding);
                }

            }).click(function (event, notPushed) {

                event.stopPropagation();
                openSection($(this), "bottom", "top", notPushed);
            });

            $window.resize(function () {
                calcHalfHeight();

                if ($main.hasClass("top")) {
                    $main.css("bottom", halfHeight);
                    $bottomSection.filter(".open").find(".content").css("height", halfHeight);
                    $bottomSection.filter(".open").find(".scrollable").css("height", halfHeightPadding);
                }
                if ($main.hasClass("bottom")) {
                    $main.css("top", halfHeight);
                    $topSection.filter(".open").find(".content").css("height", halfHeight);
                    $topSection.filter(".open").find(".scrollable").css("height", halfHeightPadding);
                }
            });

            window.addEventListener("popstate", function (e) {
                if (e.state) {
                    $(".section[data-url=" + e.state + "]").trigger("click", true);
                } else {
                    history.back();
                }
            });

            publics.accountLogin();
            publics.listeningAccountLogin();
            publics.accountLogout();
            publics.listeningAccountLogout();

            publics.generateEmail();

            publics.editAtlas(function () {
                $(".toggle.checkbox").removeClass("checked");
                $(".toggle.checkbox").find("input").prop("checked", false);
            }, function () {
                $(".toggle.checkbox").addClass("checked");
                $(".toggle.checkbox").find("input").prop("checked", true);
            });

            publics.activeEditMode();
        });
    };
}(website));





/*------------------------------------*\
    $%START PROCESS
\*------------------------------------*/

$(function () {
    "use strict";

    // Launch Common JavaScript.
    website.init();
});