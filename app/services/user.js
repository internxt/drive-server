module.exports = (Model) => {
  // NOTE: sample implementation
  const GetAll = () => Model.User.find({})

  return {
    Name: 'User',
    GetAll
  }
}
