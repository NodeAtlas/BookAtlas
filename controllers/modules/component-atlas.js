/* jslint node: true */
var website = {};

(function (publics) {

    var privates = {};

    publics.changeSection = function (dom, replacement) {
        dom = dom
            .replace(/<(template|div|nav|aside|article|section)\$/g, "<" + replacement)
            .replace(/<\/(template|div|nav|aside|article|section)\$>/g, "</" + replacement + ">");

        return dom;
    };

    publics.changeComponentName = function (dom, replacement) {
        var componentName = dom.match(/class\$=("|')([-_\\.a-zA-Z0-9 ]*) ?/g);

        if (componentName && !replacement) {
            replacement = componentName[0].replace(/class\$=("|')/g, "").trim();
        } else if (!componentName && !replacement) {
            replacement = "";
        }

        dom = dom
            .replace(/class\$=/g, "class=")
            .replace(/=("|')([-_\\.a-zA-Z0-9 ]*)(\$\$)([-_\\.a-zA-Z0-9 ]*)("|')/g, "=$1$2" + replacement + "$4$5");

        if (replacement) {
            replacement = replacement.split(" ")[0];
        }

        dom = dom
            .replace(/=("|')([-_\\.a-zA-Z0-9 ]*)(\$)([-_\\.a-zA-Z0-9 ]*)("|')/g, "=$1$2" + replacement + "$4$5");

        return dom;
    };

    publics.changeHeaders = function (dom) {
        dom = dom
            .replace(/<(header|footer|h1|h2|h3|h4|h5|h6)\$/g, '<div class="$1-like"')
            .replace(/<div class=("|')(header|footer|h1|h2|h3|h4|h5|h6)-like("|')(.+)(class=)('|")(.+)('|")/g, '<div class=$8$2-like $7$8')
            .replace(/<\/(header|footer|h1|h2|h3|h4|h5|h6)\$>/g, "</div>");

        return dom;
    };

    publics.changeSemantic = function (component, activateSemantic, activateComponentName, dom) {
        if (typeof activateSemantic === 'string' && component.variations && component.variations[activateSemantic]) {
            if (component.variations[activateSemantic] === "div" ||
               component.variations[activateSemantic] === "header"  ||
               component.variations[activateSemantic] === "footer")
            {
                dom = publics.changeHeaders(dom);
            } else {
                dom = publics.ignoreHeaders(dom);
            }

            dom = publics.changeSection(dom, component.variations[activateSemantic]);
        } else {
            dom = publics.ignoreHeaders(dom);
        }

        if (typeof activateComponentName === 'string') {
            if (component.variations && component.variations[activateComponentName]) {
                dom = publics.changeComponentName(dom, component.variations[activateComponentName]);
            } else {
                dom = publics.changeComponentName(dom, undefined);
            }
        }

        return dom;
    };

    publics.ignoreHeaders = function (dom) {
        dom = dom
            .replace(/<(template|div|nav|aside|article|section|header|footer|h1|h2|h3|h4|h5|h6)\$/g, '<$1')
            .replace(/<\/(template|div|nav|aside|article|section|header|footer|h1|h2|h3|h4|h5|h6)\$>/g, "</$1>");

        return dom;
    };

    publics.setCurrentComponents = function (component, componentVariation, currentComponents, variations) {
        if (component) {
            currentComponents = component[componentVariation];
            if (typeof component === 'string') {
                currentComponents = variations[component][componentVariation];
            }
        }

        return currentComponents;
    };

    publics.placeholderNoEmpty = function (currentComponents, placeholder, callback) {
        if (typeof currentComponents !== 'undefined' &&
            typeof currentComponents[placeholder] !== 'undefined'
            && currentComponents[placeholder].length > 0)
        {
            callback();
        }
    };

    publics.includeComponent = function (component, path, variations) {
        var NA = this,
            dom = "",
            ejs = NA.modules.ejs;

        dom = ejs.render(
            '<?- include("' + component.path + '", { component: ' + JSON.stringify(component.variations) + ', path: "' + path + '" }) ?>',
            variations
        );

        dom = publics.changeSemantic(component, privates.activateSemantic, privates.activateComponentName, dom);

        return dom;
    };

    publics.includeComponents = function (variations, componentVariation, activateSemantic, activateComponentName) {
        var NA = this,
            ejs = NA.modules.ejs;

        variations.ic = variations.includeComponents = function (placeholder, component, path) {
            var render = "",
                currentComponents = variations.specific[componentVariation],
                currentVariation,
                currentPath,
                dom = "";

            privates.activateSemantic = activateSemantic;
            privates.activateComponentName = activateComponentName;

            if (!componentVariation) {
                componentVariation = "components";
            }

            currentComponents = publics.setCurrentComponents(component, componentVariation, currentComponents, variations);

            publics.placeholderNoEmpty(currentComponents, placeholder, function () {
                for (var i = 0; i < currentComponents[placeholder].length; i++) {

                    currentVariation = 'specific["' + componentVariation + '"]["' + placeholder + '"][' + i + '].variations';
                    currentPath = ((path) ? path : "") + componentVariation + "." + placeholder + "[" + i + "].variations.";

                    if (component && typeof component === 'string') {
                        currentVariation = component + '["' + componentVariation + '"]["' + placeholder + '"][' + i + '].variations';
                    } else if (component && typeof component !== 'string') {
                        currentVariation = JSON.stringify(currentComponents[placeholder][i].variations);
                    }

                    dom = ejs.render(
                        '<?- include("' + currentComponents[placeholder][i].path + '", { component: ' + currentVariation + ', path : "' + currentPath + '" }) ?>',
                        variations
                    );

                    dom = publics.changeSemantic(currentComponents[placeholder][i], activateSemantic, activateComponentName, dom);

                    render = render + dom;
                }
            });

            return render;
        };

        variations.component = {};

        return variations;
    };

}(website));

exports.includeComponents = website.includeComponents;
exports.includeComponent = website.includeComponent;