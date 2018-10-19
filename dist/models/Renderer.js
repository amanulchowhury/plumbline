'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const Rendering_1 = require("./Rendering");
const utils_1 = require("../utils/utils");
const initComponent_1 = require("../utils/initComponent");
class Renderer {
    constructor(tester) {
        this.completeModule = null;
        this.renderModule = null;
        this.tester = tester;
        this.completeModule = this.tester.getCompleteModule();
    }
    // Render the entire TestBed instance of the component + markup
    render(html, optionsIn) {
        // Options for binding and future customization
        let options = Object.assign({ detectChanges: true, bind: {} }, optionsIn);
        // Initialize the markup for the component
        let curComponent = html ? initComponent_1.initComponent(html, options.bind) :
            this.tester.testComponent;
        // Generate the complete module from all the pieces
        let copiedSetup = this.completeModule;
        let configTestingSettings = {
            imports: copiedSetup.imports,
            providers: copiedSetup.providers.map((p) => {
                return this.spyProvider(p);
            }),
            declarations: copiedSetup.declarations.concat([curComponent]),
            schemas: copiedSetup.schemas,
        };
        this.renderModule = configTestingSettings;
        // Start Testing Module using autogenerated custom config settings
        return new Promise((resolve, reject) => {
            // Detect javascript errors and track them in Jasmine
            let __error = console.error;
            console.error = function (...args) {
                let fullMessage = '';
                args.forEach((message) => { fullMessage += message + ' '; });
                expect('javascript errors').toBe('none', fullMessage);
                // Still report errors in the debug console
                __error.apply(console, args);
            };
            try {
                // Initialize TestBed for this Component
                testing_1.TestBed.configureTestingModule(configTestingSettings)
                    .compileComponents().then(() => {
                    let fixture = testing_1.TestBed.createComponent(curComponent);
                    if (options.detectChanges) {
                        fixture.detectChanges();
                    }
                    // Return a Rendering object
                    resolve(new Rendering_1.default(this.tester, fixture, options.bind));
                });
            }
            catch (err) {
                console.log(configTestingSettings);
                console.error(err);
            }
        });
    }
    // Spy on all providers
    spyProvider(providerIn) {
        // for arrays, breakdown the individual providers
        if (Array.isArray(providerIn)) {
            return providerIn.map((p) => {
                return this.spyProvider(p);
            });
        }
        else {
            // Check for providers that come in {provide, useValue} form
            if (utils_1.isValueProvider(providerIn)) {
                let provide = providerIn.provide;
                let useValue = providerIn.useValue;
                if (provide && !this.tester.dontMock.includes(provide)) {
                    // go through all the objects functions and spyOn the,
                    Object.keys(useValue).forEach(function (key) {
                        if (typeof useValue[key] === 'function') {
                            spyOn(useValue, key).and.callThrough();
                        }
                    });
                    return { provide, useValue };
                }
            }
            else {
                return providerIn;
            }
        }
    }
}
exports.default = Renderer;