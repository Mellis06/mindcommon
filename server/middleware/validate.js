function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "The request body is invalid.",
        issues: result.error.issues.map((item) => ({
          path: item.path.join("."),
          message: item.message
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validateBody };
