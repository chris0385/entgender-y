import {expect} from 'chai';
import {BeGone} from '../src/gendersprachekorrigieren';
import {JSDOM} from 'jsdom';
import {replacementTestStrings} from "./testdata";

// Note: MutationObserver is not implemented in JSDOM, so we cannot test the updates in unittests
// TODO: create a page which fills the testdata using javascript

declare global {
    namespace NodeJS {
        interface Global {
            document: Document;
            window: Window;
            navigator: Navigator;
        }
    }
}

beforeEach(() => {

    const dom = new JSDOM(
        `<html>
       <body>
       <main></main>
       </body>
     </html>`,
        {url: 'http://localhost'},
    );
    global.window = dom.window;
    global.document = dom.window.document;

    // Workaround, because stuff which is in the global context in browser isn't when running in node
    const g = <any>global;
    const w = <any>window;
    if (typeof NodeFilter == 'undefined') {
        for (let glbl of 'MutationObserver,NodeFilter,HTMLPreElement,HTMLInputElement,HTMLTextAreaElement,HTMLScriptElement,HTMLTextAreaElement,HTMLStyleElement,'.split(",")) {
            glbl = glbl.trim();
            if (w[glbl]) {
                g[glbl] = w[glbl];
            }
        }
    }
});

function setDocumentBody(html: string) {
    document.body.innerHTML = html;
}

function createParagraph(str: string): HTMLElement {
    const text = document.createTextNode(str);
    const p = document.createElement('p');
    p.appendChild(text);
    return p;
}

let beGone = new BeGone();

function testFromToInitial(from: string, to: string) {
    //setDocumentBody(`<div>${from}</div>`);
    document.body.appendChild(createParagraph(from));

    beGone.entferneInitial();

    expect(document.body.textContent!!.trim()).to.be.equal(`${to}`.trim());
    console.log(`${from} -> ${to}`);
}

describe('setzte ins Neutrum', () => {

    for (let [from, to] of replacementTestStrings) {
        it(`${from} -> ${to}`, () => {
            testFromToInitial(from, to);
        });
    }
});