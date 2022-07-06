const { not } = require("sequelize/types/lib/operators");

const expect = require("chai").expect;


it("test for a sum of two number" , function()
{
        const num1 =3;
        const num2 = 3;

        expect(num1+num2).not.to.equal(6);
});

