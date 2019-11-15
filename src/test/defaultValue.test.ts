import * as assert from 'assert';
import {Args} from '../core';


describe('Get Default Value', function() {
    describe('Default Value test 1', function() {
      it('is should return None not the', function() {
        let arg = new Args('test', 't', 'script', ' Command executed when the refresh button is pressed  Note: by default the refresh button is hidden and will be shown automatically when this command script is attached  ');
        assert.equal(arg.getDefaultValue(), 'None');
      });
    });
  });