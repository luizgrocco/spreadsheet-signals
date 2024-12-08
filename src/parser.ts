import { CellId, Sheet } from "./models";
import { expandRange } from "./utils";

// Result
type Result<T, Error> = { ok: true; value: T } | { ok: false; err: Error };

// Parser Combinators
type ParseInput = string;
type ParseResult<T> = [Result<T, Error>, ParseInput];
export type Parser<T> = (input: ParseInput) => ParseResult<T>;

export const succeed = <T>(
  result: T,
  inputAfterOk: ParseInput
): ParseResult<T> => [{ ok: true, value: result }, inputAfterOk];

// TODO: I have come to regret this decision, by experience you will never use the remaining string after a parser fails.
export const fail = <T = never>(
  inputAfterFail: ParseInput,
  errMsg = "failed without a message"
): ParseResult<T> => [{ ok: false, err: new Error(errMsg) }, inputAfterFail];

type Char = string;

export const satisfy =
  (testFn: (c: Char) => boolean): Parser<Char> =>
  (input: ParseInput) =>
    input.length > 0 && testFn(input[0])
      ? succeed(input[0], input.slice(1))
      : fail(input, `failed to parse ${input[0]}`);

export const char =
  <const T extends string>(c: T): Parser<T> =>
  (input: ParseInput) =>
    input.length > 0 && input[0] === c
      ? succeed(c, input.slice(1))
      : fail(
          input,
          input.length === 0
            ? `failed to parse the char "${c}" on an empty input`
            : `failed to parse the char "${c}" on input "${input}"`
        );

export const letter =
  <const T extends string>(c: T): Parser<Lowercase<T>> =>
  (input: ParseInput) => {
    const [result, remainder] = or(
      char(c.toLowerCase()),
      char(c.toUpperCase())
    )(input);
    if (result.ok) return succeed(c.toLowerCase() as Lowercase<T>, remainder);
    return fail(remainder, result.err.message);
  };

export const empty: Parser<""> = (input: ParseInput) => succeed("", input);

export const literal =
  <T extends string>(literal: T): Parser<T> =>
  (input: ParseInput) =>
    input.startsWith(literal)
      ? succeed(literal, input.slice(literal.length))
      : fail(input, `failed to parse literal "${literal}" on input "${input}"`);

export const map =
  <T, R>(parser: Parser<T>, fn: (arg: T) => R): Parser<R> =>
  (input: ParseInput) => {
    const [result, remainder] = parser(input);
    return result.ok
      ? succeed(fn(result.value), remainder)
      : [result, remainder];
  };

export const or =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<T | R> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);
    if (firstResult.ok) return [firstResult, firstRemainder];
    return secondParser(input);
  };

export const any =
  // deno-lint-ignore no-explicit-any

    <U, T extends any[]>(
      firstParser: Parser<U>,
      ...parsers: { [K in keyof T]: Parser<T[K]> }
    ): Parser<U | T[number]> =>
    (input: ParseInput) => {
      let [result, remainder] = firstParser(input);

      if (!result.ok) {
        for (const parser of parsers) {
          [result, remainder] = parser(input);
          if (result.ok) return [result, remainder];
        }
      }

      return [result, remainder];
    };

export const and =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<[T, R]> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);

    if (!firstResult.ok) return [firstResult, input];

    const [secondResult, remainder] = secondParser(firstRemainder);
    return secondResult.ok
      ? succeed([firstResult.value, secondResult.value], remainder)
      : [secondResult, input];
  };

// deno-lint-ignore no-explicit-any
export const sequence = <U, T extends any[]>(
  firstParser: Parser<U>,
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<[U, ...T]> =>
  parsers.reduce(
    (acc, parser) =>
      map(and(acc, parser), ([results, result]) => [...results, result]),
    map(firstParser, (result) => [result])
  );

export const exactly =
  <T>(n: number, parser: Parser<T>): Parser<T[]> =>
  (input: ParseInput) => {
    let inputRemainder = input;
    const resultAcc: T[] = [];

    for (let i = 0; i < n; i++) {
      const [result, remaining] = parser(inputRemainder);

      if (!result.ok) return [result, input];

      resultAcc.push(result.value);
      inputRemainder = remaining;
    }

    return succeed(resultAcc, inputRemainder);
  };

export const some =
  <T>(parser: Parser<T>): Parser<T[]> =>
  (input: ParseInput) => {
    let [result, remainder] = parser(input);

    if (!result.ok) return [result, remainder];

    let inputRemainder = remainder;
    const resultAcc: T[] = [];
    do {
      resultAcc.push(result.value);
      inputRemainder = remainder;
      [result, remainder] = parser(inputRemainder);
    } while (result.ok && inputRemainder.length !== remainder.length);

    return succeed(resultAcc, inputRemainder);
  };

export const optional = <T>(parser: Parser<T>) => or(parser, empty);

export const precededBy = <T, R>(
  precedingParser: Parser<T>,
  parser: Parser<R>
): Parser<R> => map(and(precedingParser, parser), ([, result]) => result);

export const succeededBy = <T, R>(
  succeedingParser: Parser<R>,
  parser: Parser<T>
): Parser<T> => map(and(parser, succeedingParser), ([result]) => result);

export const joinedBy = <T, Q>(
  joiningParser: Parser<T>,
  parser: Parser<Q>
): Parser<[Q, Q]> => and(succeededBy(joiningParser, parser), parser);

export const delimitedBy = <T, R, Q>(
  precedingParser: Parser<T>,
  succeedingParser: Parser<R>,
  parser: Parser<Q>
): Parser<Q> =>
  precededBy(precedingParser, succeededBy(succeedingParser, parser));

export const surroundedBy = <T, Q>(
  surroundingParser: Parser<T>,
  parser: Parser<Q>
) => delimitedBy(surroundingParser, surroundingParser, parser);

export const spaced = <T>(parser: Parser<T>): Parser<T> =>
  surroundedBy(optional(some(char(" "))), parser);

// TODO: A whole study can emerge around the topic of lookahead from considering what this parser should do
// const not = <T>(parser: Parser<T>): Parser<T> => (input: ParseInput) {
//   const [result] = parser(input)
// }

const positiveDigit = any(
  char("1"),
  char("2"),
  char("3"),
  char("4"),
  char("5"),
  char("6"),
  char("7"),
  char("8"),
  char("9")
);

const zero = char("0");

const digit = any(zero, positiveDigit);

export const natural = map(some(digit), (digits) =>
  parseInt(digits.join(""), 10)
);

export const integer = map(and(optional(char("-")), natural), (result) =>
  parseInt(result.join(""), 10)
);

export const number = map(
  and(
    integer,
    optional(
      and(
        char("."),
        map(some(digit), (digits) => digits.join(""))
      )
    )
  ),
  ([integerPart, decimalPart]) =>
    decimalPart === ""
      ? integerPart
      : parseFloat(integerPart + decimalPart.join(""))
);

// All code below this point I would consider to be USERLAND code, the essential parsers are already defined above

type Operators = "+" | "-" | "*" | "/" | "^";

const binaryOperations = (
  leftArg: number,
  rightArg: number,
  operator: Operators
): number => {
  let result: number;

  switch (operator) {
    case "+":
      result = leftArg + rightArg;
      break;
    case "-":
      result = leftArg - rightArg;
      break;
    case "*":
      result = leftArg * rightArg;
      break;
    case "/":
      result = leftArg / rightArg;
      break;
    case "^":
      result = Math.pow(leftArg, rightArg);
      break;
  }

  return result;
};

const unnestExpression = (
  [left, operator, right]: RecursiveOperation<Operators>,
  operands: number[] = [],
  operators: Operators[] = []
): { operands: number[]; operators: Operators[] } => {
  operands.push(left);
  operators.push(operator);

  if (Array.isArray(right)) return unnestExpression(right, operands, operators);

  operands.push(right);
  return { operands, operators };
};

const alphabet = any(
  letter("a"),
  letter("b"),
  letter("c"),
  letter("d"),
  letter("e"),
  letter("f"),
  letter("g"),
  letter("h"),
  letter("i"),
  letter("j"),
  letter("k"),
  letter("l"),
  letter("m"),
  letter("n"),
  letter("o"),
  letter("p"),
  letter("q"),
  letter("r"),
  letter("s"),
  letter("t"),
  letter("u"),
  letter("v"),
  letter("w"),
  letter("x"),
  letter("y"),
  letter("z")
);

export const cellId = spaced(sequence(some(alphabet), number));

type RecursiveOperation<T> = [number, T, number | RecursiveOperation<T>];

export const createSpreadsheetFormulaParser = (
  sheet: Sheet<number>
): Parser<number> => {
  const additiveTerm = (parseInput: ParseInput) => {
    const parseAdditive = (recusiveInput: ParseInput) =>
      or(
        sequence(
          spaced(multiplicativeTerm),
          or(char("+"), char("-")),
          parseAdditive
        ),
        spaced(multiplicativeTerm)
      )(recusiveInput);

    return map(parseAdditive, (addtiveTerms) => {
      if (!Array.isArray(addtiveTerms)) return addtiveTerms;

      const { operands, operators } = unnestExpression(
        addtiveTerms as RecursiveOperation<Operators>
      );
      return operands.reduce((acc, num) =>
        binaryOperations(acc, num, operators.shift()!)
      );
    })(parseInput);
  };

  const multiplicativeTerm = (parseInput: ParseInput) => {
    const parseMultiplicative = (recusiveInput: ParseInput) =>
      or(
        sequence(
          spaced(exponentiationTerm),
          or(char("*"), char("/")),
          parseMultiplicative
        ),
        spaced(exponentiationTerm)
      )(recusiveInput);
    return map(parseMultiplicative, (multTerms) => {
      if (!Array.isArray(multTerms)) return multTerms;

      const { operands, operators } = unnestExpression(
        multTerms as RecursiveOperation<Operators>
      );
      return operands.reduce((acc, num) =>
        binaryOperations(acc, num, operators.shift()!)
      );
    })(parseInput);
  };

  const exponentiationTerm = (parseInput: ParseInput) => {
    const parseExponentiation = (recursiveInput: ParseInput) =>
      or(
        sequence(spaced(parenthesizedTerm), char("^"), parseExponentiation),
        spaced(parenthesizedTerm)
      )(recursiveInput);
    return map(parseExponentiation, (expoTerms) => {
      if (!Array.isArray(expoTerms)) return expoTerms;

      const { operands, operators } = unnestExpression(
        expoTerms as RecursiveOperation<Operators>
      );
      return operands.reduce((acc, num) =>
        binaryOperations(acc, num, operators.shift()!)
      );
    })(parseInput);
  };

  const parenthesizedTerm: Parser<number> = (parseInput: ParseInput) =>
    or(
      delimitedBy(spaced(char("(")), spaced(char(")")), additiveTerm),
      spreadsheetTerm
    )(parseInput);

  const cellIdTerm: Parser<number> = map(cellId, ([colLetters, rowNumber]) => {
    const cellId = (colLetters.join("") + rowNumber.toString()).toUpperCase();
    const cell = sheet.getOrDefault(cellId);

    return cell.computed();
  });

  const functionNames = any(
    literal("SUM"),
    literal("COUNT"),
    literal("MULT"),
    literal("AVG"),
    literal("MAX"),
    literal("MIN"),
    literal("COLS"),
    literal("ROWS")
  );

  const cellRange: Parser<CellId[]> = map(
    joinedBy(char(":"), spaced(cellId)),
    ([from, to]) => {
      const [fromColLetters, fromRowNumber] = from;
      const [toColLetters, toRowNumber] = to;

      const fromCellId = (
        fromColLetters.join("") + fromRowNumber.toString()
      ).toUpperCase();
      const toCellId = (
        toColLetters.join("") + toRowNumber.toString()
      ).toUpperCase();

      return expandRange(fromCellId, toCellId);
    }
  );

  const functionArgument = or(cellRange, additiveTerm);

  const functionCall: Parser<number> = map(
    and(
      functionNames,
      delimitedBy(
        spaced(char("(")),
        spaced(char(")")),
        some(spaced(functionArgument))
      )
    ),
    ([functionName, functionArguments]) => {
      const argumentsAsNumbers = functionArguments.flatMap((argument) =>
        Array.isArray(argument)
          ? argument.map((cellId) => sheet.getOrDefault(cellId).computed())
          : argument
      );

      console.log({
        functionName,
        functionArguments,
        argumentsAsNumbers,
        sheet,
      });
      switch (functionName) {
        case "SUM":
          return argumentsAsNumbers.reduce((acc, item) => acc + item, 0);
        case "COUNT":
          return argumentsAsNumbers.length;
        case "MULT":
          return argumentsAsNumbers.reduce((acc, item) => acc * item, 1);
        case "AVG":
          return (
            argumentsAsNumbers.reduce((acc, item) => acc + item, 0) /
            argumentsAsNumbers.length
          );
        case "MAX":
          return Math.max(...argumentsAsNumbers);
        case "MIN":
          return Math.min(...argumentsAsNumbers);
        case "COLS":
          return 0;
        case "ROWS":
          return 0;
        default:
          return 0;
      }
    }
  );

  const spreadsheetTerm = spaced(any(number, cellIdTerm, functionCall));

  return or(precededBy(spaced(char("=")), additiveTerm), spaced(number));
};

// TODO: Huge performance gains with memoization
// const memoizeParser =
//   <T>(fn: (...args: any[]) => T) =>
//   (...args: any[]): T => {
//     return fn(args);
//   };
