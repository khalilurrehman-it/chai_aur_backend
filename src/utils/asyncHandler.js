// Here we will use promises to handle async functions.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// Here we will use async/await to handle async functions.

// // const asyncHandler = (fn) => {() => {}};

// // This file is used to create a middleware function that handles async functions.
// // This is wrapper function that will be used in many places in the codebase to handle async functions.
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// export { asyncHandler };
