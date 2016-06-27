var chai = require('chai');
var expect = chai.expect;
var vision = require('../views/scripts/vision.js');

describe('vision' , function() {
	it('getNumOfPeople() should return 0 if there is no humans present', function() { 
		var vision = new Vision([]);
		expect(vision.getNumOfPeople().to.equal(0));
	});
});
