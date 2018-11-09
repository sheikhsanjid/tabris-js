import {expect, mockTabris, restore, stub} from '../test';
import ClientStub from './ClientStub';
import NativeObject from '../../src/tabris/NativeObject';
import WidgetCollection from '../../src/tabris/WidgetCollection';
import {types} from '../../src/tabris/property-types';
import {omit} from '../../src/tabris/util';
import {LinearGradientShader} from '../../src/tabris/util-shaders';

describe('property-types', function() {

  // Allow creating instances of NativeObject
  class CustomNativeObject extends NativeObject {
    constructor(cid) {
      super(cid);
    }
  }

  beforeEach(function() {
    let client = new ClientStub();
    mockTabris(client);
  });

  afterEach(restore);

  describe('ColorValue', function() {

    it('encode translates "initial" to `undefined`', function() {
      expect(types.ColorValue.encode('initial')).to.equal(undefined);
    });

    it('encode translates `null` to `undefined`', function() {
      expect(types.ColorValue.encode(null)).to.equal(undefined);
    });

  });

  describe('shader', function() {

    it('encode translates "initial" to `undefined`', function() {
      expect(types.shader.encode('initial')).to.equal(undefined);
    });

    it('encode translates `null` to `undefined`', function() {
      expect(types.shader.encode(null)).to.equal(undefined);
    });

    it('encode converts linear gradient definition to LinearGradientShader', function() {
      expect(types.shader.encode('linear-gradient(red, blue)')).to.be.instanceof(LinearGradientShader);
    });

    it('decode converts falsy to transparent color', function() {
      expect(types.shader.decode(null)).to.equal('rgba(0, 0, 0, 0)');
    });

    it('decode converts LinearGradientShader to css gradient definition', function() {
      const shader = new LinearGradientShader('linear-gradient(red, blue)');
      expect(types.shader.decode(shader)).to.equal('linear-gradient(red, blue)');
    });

    it('decode converts color shader to css color definition', function() {
      expect(types.shader.decode({color: [0, 0, 255, 255], type: 'color'})).to.equal('rgb(0, 0, 255)');
    });

    it('decode converts Array to css color definition', function() {
      expect(types.shader.decode([0, 0, 255, 255])).to.equal('rgba(0, 0, 255, 1)');
    });

  });

  describe('font', function() {

    it('encode translates "initial" to `undefined`', function() {
      expect(types.FontValue.encode('initial')).to.equal(undefined);
    });

    it('encode translates `null` to `undefined`', function() {
      expect(types.FontValue.encode(null)).to.equal(undefined);
    });

  });

  describe('NativeObject', function() {

    let encode = types.NativeObject.encode;
    let decode = types.NativeObject.decode;

    it('translates widgets to ids in properties', function() {
      let value = new CustomNativeObject();

      expect(encode(value)).to.equal(value.cid);
    });

    it('translates widget collection to first ids in properties', function() {
      let value = new WidgetCollection([new CustomNativeObject()]);

      expect(encode(value)).to.equal(value[0].cid);
    });

    it('does not translate objects with id field to ids', function() {
      let value = {id: '23', name: 'bar'};

      expect(encode(value)).to.equal(value);
    });

    it('translates ids to widgets', function() {
      let value = new CustomNativeObject();

      expect(decode(value.cid)).to.equal(value);
    });

  });

  describe('image', function() {

    let encode = types.ImageValue.encode;

    it('succeeds for minimal image value', function() {
      stub(console, 'warn');

      let result = encode({src: 'foo.png'});

      expect(result).to.eql(['foo.png', null, null, null]);
      expect(console.warn).not.to.have.been.called;
    });

    it('succeeds for image with width and height', function() {
      stub(console, 'warn');

      let result = encode({src: 'foo.png', width: 10, height: 10});

      expect(result).to.eql(['foo.png', 10, 10, null]);
      expect(console.warn).not.to.have.been.called;
    });

    it('succeeds for image with scale', function() {
      stub(console, 'warn');

      let result = encode({src: 'foo.png', scale: 1.4});

      expect(result).to.eql(['foo.png', null, null, 1.4]);
      expect(console.warn).not.to.have.been.called;
    });

    it('succeeds for string', function() {
      expect(encode('foo.jpg')).to.eql(['foo.jpg', null, null, null]);
    });

    it('succeeds for string with scale detection via file name', function() {
      expect(encode('foo@2x.jpg')).to.eql(['foo@2x.jpg', null, null, 2]);
      expect(encode('foo@1.4x.jpg')).to.eql(['foo@1.4x.jpg', null, null, 1.4]);
      expect(encode('foo@2.jpg')).to.eql(['foo@2.jpg', null, null, null]);
      expect(encode('foo2x.jpg')).to.eql(['foo2x.jpg', null, null, null]);
      expect(encode('foo2x.jpg')).to.eql(['foo2x.jpg', null, null, null]);
    });

    it('succeeds for object with scale detection via file name', function() {
      expect(encode({src: 'foo@2x.jpg'})).to.eql(['foo@2x.jpg', null, null, 2]);
      expect(encode({src: 'foo@1.4x.jpg'})).to.eql(['foo@1.4x.jpg', null, null, 1.4]);
      expect(encode({src: 'foo@2.jpg'})).to.eql(['foo@2.jpg', null, null, null]);
      expect(encode({src: 'foo2x.jpg'})).to.eql(['foo2x.jpg', null, null, null]);
      expect(encode({src: 'foo2x.jpg'})).to.eql(['foo2x.jpg', null, null, null]);
    });

    it('overrides scale detection with explicit scale or dimensions', function() {
      expect(encode({src: 'foo@2x.jpg', scale: 1})).to.eql(['foo@2x.jpg', null, null, 1]);
      expect(encode({src: 'foo@1.4x.jpg', width: 10})).to.eql(['foo@1.4x.jpg', 10, null, null]);
      expect(encode({src: 'foo@1.4x.jpg', height: 10})).to.eql(['foo@1.4x.jpg', null, 10, null]);
    });

    it('has no scale detection for scale pattern in path', function() {
      expect(encode('foo@2x/bar.jpg')).to.eql(['foo@2x/bar.jpg', null, null, null]);
      expect(encode('foo@3x/bar@2x.jpg')).to.eql(['foo@3x/bar@2x.jpg', null, null, 2]);
    });

    it('succeeds for null', function() {
      expect(encode(null)).to.be.null;
    });

    it('fails if image value is not an object', function() {
      expect(() => {
        encode(23);
      }).to.throw(Error, 'Not a valid ImageValue: 23');
    });

    it('fails if src is undefined', function() {
      expect(() => {
        encode({});
      }).to.throw(Error, '"src" missing');
    });

    it('fails if src is empty string', function() {
      expect(() => {
        encode({src: ''});
      }).to.throw(Error, '"src" must not be empty');
    });

    it('fails if src contains ../ segments', function() {
      expect(() => {
        encode({src: '../test.png'});
      }).to.throw(Error, 'Invalid image "src": must not contain \'..\'');
    });

    it('fails if width/height/scale values are invalid number', function() {
      let goodValues = [0, 1, 1 / 3, 0.5, Math.PI];
      let badValues = [-1, NaN, 1 / 0, -1 / 0, '1', true, false, {}];
      let props = ['width', 'height', 'scale'];
      let checkWith = function(prop, value) {
        let image = {src: 'foo'};
        image[prop] = value;
        encode(image);
      };

      props.forEach((prop) => {
        goodValues.forEach((value) => {
          expect(() => checkWith(prop, value)).not.to.throw();
        });
        badValues.forEach((value) => {
          expect(() => checkWith(prop, value)).to.throw(Error, `"${prop}" is not a dimension`);
        });
      });
    });

    it('warns if scale and width are given', function() {
      stub(console, 'warn');

      encode({src: 'foo.png', width: 23, scale: 2});

      expect(console.warn).to.have.been.calledWith(
        'Image "scale" ignored when "width" and/or "height" are set to a number'
      );
    });

    it('warns if scale and height are given', function() {
      stub(console, 'warn');

      encode({src: 'foo.png', height: 23, scale: 2});

      expect(console.warn).to.have.been.calledWith(
        'Image "scale" ignored when "width" and/or "height" are set to a number'
      );
    });

  });

  describe('boolean', function() {

    let encode = types.boolean.encode;

    it('passes through true', function() {
      expect(encode(true)).to.equal(true);
    });

    it('passes through false', function() {
      expect(encode(false)).to.equal(false);
    });

    it('translates falsy values', function() {
      expect(encode(null)).to.equal(false);
      expect(encode('')).to.equal(false);
      expect(encode(undefined)).to.equal(false);
      expect(encode(0)).to.equal(false);
    });

    it('translates truthy values', function() {
      expect(encode(1)).to.equal(true);
      expect(encode({})).to.equal(true);
      expect(encode('true')).to.equal(true);
      expect(encode('false')).to.equal(true);
    });

  });

  describe('string', function() {

    let encode = types.string.encode;

    it('translates null to empty string', function() {
      expect(encode(null)).to.equal('');
      expect(encode(undefined)).to.equal('');
    });

    it('translates other types to string', function() {
      expect(encode('str')).to.equal('str');
      expect(encode(23)).to.equal('23');
      expect(encode(false)).to.equal('false');
      expect(encode({})).to.equal('[object Object]');
      expect(encode([1, 2, 3])).to.equal('1,2,3');
      expect(encode({toString() {return 'foo';}})).to.equal('foo');
    });

  });

  describe('number', function() {

    let encode = types.number.encode;

    it('fails for non-numbers', function() {
      expect(() => encode()).to.throw(Error, 'Not a number: undefined');
      expect(() => encode(null)).to.throw(Error, 'Not a number: null');
      expect(() => encode(true)).to.throw(Error, 'Not a number: true');
      expect(() => encode('')).to.throw(Error, "Not a number: ''");
      expect(() => encode('23x')).to.throw(Error, "Not a number: '23x'");
      expect(() => encode({})).to.throw(Error, 'Not a number: {}');
      expect(() => encode([])).to.throw(Error, 'Not a number: []');
    });

    it('fails for invalid numbers', function() {
      let values = [NaN, 1 / 0, -1 / 0];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, 'Invalid number: ' + value);
      });
    });

    it('accepts all valid kinds of numbers', function() {
      expect(encode(0)).to.equal(0);
      expect(encode(1)).to.equal(1);
      expect(encode(-1)).to.equal(-1);
      expect(encode(10e10)).to.equal(10e10);
      expect(encode(10e-10)).to.equal(10e-10);
    });

    it('accepts strings', function() {
      expect(encode('0')).to.equal(0);
      expect(encode('1')).to.equal(1);
      expect(encode('-1')).to.equal(-1);
      expect(encode('3.14')).to.equal(3.14);
      expect(encode('-3.14')).to.equal(-3.14);
      expect(encode('.01')).to.equal(0.01);
    });

  });

  describe('natural', function() {

    let encode = types.natural.encode;

    it('fails for non-numbers', function() {
      expect(() => encode()).to.throw(Error, 'Not a number: undefined');
      expect(() => encode(null)).to.throw(Error, 'Not a number: null');
      expect(() => encode(true)).to.throw(Error, 'Not a number: true');
      expect(() => encode('')).to.throw(Error, "Not a number: ''");
      expect(() => encode('23x')).to.throw(Error, "Not a number: '23x'");
      expect(() => encode({})).to.throw(Error, 'Not a number: {}');
      expect(() => encode([])).to.throw(Error, 'Not a number: []');
    });

    it('fails for invalid numbers', function() {
      let values = [NaN, 1 / 0, -1 / 0];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, 'Invalid number: ' + value);
      });
    });

    it('accepts natural number including zero', function() {
      expect(encode(0)).to.equal(0);
      expect(encode(1)).to.equal(1);
      expect(encode(10e10)).to.equal(10e10);
    });

    it('normalizes negative values', function() {
      expect(encode(-1)).to.equal(0);
      expect(encode(-1.5)).to.equal(0);
    });

    it('rounds given value', function() {
      expect(encode(0.4)).to.equal(0);
      expect(encode(1.1)).to.equal(1);
      expect(encode(1.9)).to.equal(2);
    });

    it('accepts strings', function() {
      expect(encode('0')).to.equal(0);
      expect(encode('1')).to.equal(1);
      expect(encode('-1')).to.equal(0);
      expect(encode('0.7')).to.equal(1);
    });

  });

  describe('integer', function() {

    let encode = types.integer.encode;

    it('fails for non-numbers', function() {
      expect(() => encode()).to.throw(Error, 'Not a number: undefined');
      expect(() => encode(null)).to.throw(Error, 'Not a number: null');
      expect(() => encode(true)).to.throw(Error, 'Not a number: true');
      expect(() => encode('')).to.throw(Error, "Not a number: ''");
      expect(() => encode('23x')).to.throw(Error, "Not a number: '23x'");
      expect(() => encode({})).to.throw(Error, 'Not a number: {}');
      expect(() => encode([])).to.throw(Error, 'Not a number: []');
    });

    it('fails for invalid numbers', function() {
      let values = [NaN, 1 / 0, -1 / 0];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, 'Invalid number: ' + value);
      });
    });

    it('accepts positive and negative numbers including zero', function() {
      expect(encode(-(10e10))).to.equal(-(10e10));
      expect(encode(-1)).to.equal(-1);
      expect(encode(0)).to.equal(0);
      expect(encode(1)).to.equal(1);
      expect(encode(10e10)).to.equal(10e10);
    });

    it('rounds given value', function() {
      expect(encode(-1.9)).to.equal(-2);
      expect(encode(-1.1)).to.equal(-1);
      expect(encode(-0.4)).to.equal(0);
      expect(encode(0.4)).to.equal(0);
      expect(encode(1.1)).to.equal(1);
      expect(encode(1.9)).to.equal(2);
    });

    it('accepts strings', function() {
      expect(encode('0')).to.equal(0);
      expect(encode('1')).to.equal(1);
      expect(encode('-1')).to.equal(-1);
      expect(encode('0.7')).to.equal(1);
    });

  });

  describe('function', function() {

    let encode = types.function.encode;

    it('accepts functions', function() {
      let fn = function() {};
      expect(encode(fn)).to.equal(fn);
    });

    it('fails for non-functions', function() {
      let values = ['', 'foo', 23, null, undefined, true, false, {}, []];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, typeof value + ' is not a function: ' + value);
      });
    });

  });

  describe('choice', function() {

    let encode = types.choice.encode;

    it('allows string values given in array', function() {
      let accepted = ['1', 'foo', 'bar'];

      expect(encode('1', accepted)).to.equal('1');
      expect(encode('foo', accepted)).to.equal('foo');
      expect(encode('bar', accepted)).to.equal('bar');
    });

    it('rejects string values not given in array', function() {
      let accepted = ['x', 'y', 'z'];

      ['1', 'foo', 'bar'].forEach((value) => {
        expect(() => {
          encode(value, accepted);
        }).to.throw(Error, 'Accepting "x", "y", "z", given was: "' + value + '"');
      });
    });

  });

  describe('nullable', function() {

    let encode = types.nullable.encode;

    it('allows null', function() {
      expect(encode(null)).to.be.null;
    });

    it('allows null or alternate check', function() {
      expect(encode(null, 'natural')).to.be.null;
      expect(encode(1.1, 'natural')).to.equal(1);
    });

    it('rejects alternate check', function() {
      expect(() => {
        encode(NaN, 'natural');
      }).to.throw();
    });

  });

  describe('opacity', function() {

    let encode = types.opacity.encode;

    it('fails for non-numbers', function() {
      expect(() => encode()).to.throw(Error, 'Not a number: undefined');
      expect(() => encode(null)).to.throw(Error, 'Not a number: null');
      expect(() => encode(true)).to.throw(Error, 'Not a number: true');
      expect(() => encode('')).to.throw(Error, "Not a number: ''");
      expect(() => encode('23x')).to.throw(Error, "Not a number: '23x'");
      expect(() => encode({})).to.throw(Error, 'Not a number: {}');
      expect(() => encode([])).to.throw(Error, 'Not a number: []');
    });

    it('fails for invalid numbers', function() {
      let values = [NaN, 1 / 0, -1 / 0];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, 'Invalid number: ' + value);
      });
    });

    it('clamps out-of-bounds numbers', function() {
      expect(encode(-1)).to.equal(0);
      expect(encode(-0.1)).to.equal(0);
      expect(encode(1.1)).to.equal(1);
      expect(encode(1e10)).to.equal(1);
    });

    it('accepts strings', function() {
      expect(encode('0')).to.equal(0);
      expect(encode('0.1')).to.equal(0.1);
      expect(encode('1')).to.equal(1);
    });

    it('accepts natural numbers between (including) zero and one', function() {
      expect(encode(0)).to.equal(0);
      expect(encode(0.5)).to.equal(0.5);
      expect(encode(1)).to.equal(1);
    });

  });

  describe('transform', function() {

    let encode = types.transform.encode;
    let defaultValue = {
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      translationX: 0,
      translationY: 0,
      translationZ: 0
    };
    let customValue = {
      rotation: 1.2,
      scaleX: 2,
      scaleY: 0.5,
      translationX: -40,
      translationY: +40,
      translationZ: +20
    };

    it('accepts complete, valid values', function() {
      expect(encode(defaultValue)).to.eql(defaultValue);
      expect(encode(customValue)).to.eql(customValue);
    });

    it('auto-completes values', function() {
      let value = omit(customValue, ['scaleX', 'translationY']);
      let expected = {
        rotation: 1.2,
        scaleX: 1,
        scaleY: 0.5,
        translationX: -40,
        translationY: 0,
        translationZ: +20
      };
      expect(encode(value)).to.eql(expected);
      expect(encode({})).to.eql(defaultValue);
    });

    it('fails for invalid numbers', function() {
      [
        {rotation: null},
        {scaleX: undefined},
        {scaleY: NaN},
        {translationX: 1 / 0},
        {translationY: -1 / 0},
        {translationZ: 1 / 0}
      ].forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw();
      });
    });

    it('fails for unknown keys', function() {
      expect(() => {
        encode({foo: 1});
      }).to.throw(Error, 'Not a valid transformation containing "foo"');
    });

  });

  describe('array', function() {

    let encode = types.array.encode;

    it('passes any array', function() {
      expect(encode([1, 'a', true])).to.eql([1, 'a', true]);
    });

    it('converts null to empty array', function() {
      expect(encode(null)).to.eql([]);
    });

    it('converts undefined to empty array', function() {
      expect(encode(undefined)).to.eql([]);
    });

    it('does not copy array', function() {
      let input = [1, 2, 3];
      expect(encode(input)).to.equal(input);
    });

    it('fails for non-arrays', function() {
      let values = [0, 1, '', 'foo', false, true, {}, {length: 0}];
      values.forEach((value) => {
        expect(() => {
          encode(value);
        }).to.throw(Error, typeof value + ' is not an array: ' + value);
      });
    });

    it('performs optional item checks', function() {
      expect(encode(['foo', 1, true], 'string')).to.eql(['foo', '1', 'true']);
      expect(() => encode(['foo'], 'integer')).to.throw(Error, "Not a number: 'foo'");
    });

  });

  describe('boxDimensions encode', function() {

    let encode = types.boxDimensions.encode;

    it('passes objects', function() {
      expect(encode({left: 1, right: 2, top: 3, bottom: 4})).to.deep.equal({left: 1, right: 2, top: 3, bottom: 4});
    });

    it('converts numbers to objects', function() {
      expect(encode(4)).to.deep.equal({left: 4, right: 4, top: 4, bottom: 4});
    });

    it('converts null to 0', function() {
      expect(encode(null)).to.deep.equal({left: 0, right: 0, top: 0, bottom: 0});
    });

    it('fails for invalid types', function() {
      expect(() => encode('foo')).to.throw(Error, 'Invalid type: foo');
      expect(() => encode(false)).to.throw(Error, 'Invalid type: false');
      expect(() => encode(true)).to.throw(Error, 'Invalid type: true');
    });

  });

});
