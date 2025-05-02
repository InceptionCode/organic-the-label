export const ThrowGlobal = ({ condition }: { condition: boolean }) => {
  const fakeError = () => {
    console.log('Throwing a fake error!');
    throw new Error('Whoops! good thing this is a test. Nothing is wrong I think!');
  };

  return condition && <div className={fakeError()} />;
};
