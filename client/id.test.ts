import { getId, resetId } from "./id";

test("get id", () => {
  resetId();
  const id1 = getId();
  const id2 = getId();
  const id3 = getId();
  expect(id1).toBe(1);
  expect(id2).toBe(2);
  expect(id3).toBe(3);

  jest.useFakeTimers();
  jest.setSystemTime(Date.now() + 1e10 + 1);
  const id4 = getId();
  expect(id4).toBe(1);
});
