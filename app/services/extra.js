
module.exports = (Model, App) => {
    /**
   * Sets welcome file value to the specified value.
   *
   * false by default (means delete welcome file)
   *
   * @param {User} user
   * @param {boolean} value
   */
    const SetWelcomeFile = (user, value = false) => {

    };

    return {
        Name: 'Extras',
        SetWelcomeFile
    };
};
