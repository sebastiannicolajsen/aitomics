import {$, _, EqualComparisonModel} from './index.js'


const c1 = $(["Split the string into words and organize it as a json array withot additional clutter. Only return this."])
const c2 = _.compose(c1, _.lowerCase, _.stringToJSON)

const def = $((a) => ["that", "is", "a", "cat"])

const input = "This is a cat"

const result1 = await def.run(input)
const result2 = await c2.run(input)

const comp = result1.compare(result2)

const compresult = comp.run(new EqualComparisonModel)

console.log(compresult)


