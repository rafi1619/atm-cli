let currentUser = null;

module.exports = {
  setUser: (user) => {
    currentUser = user;
  },
  getCurrentUser: () => currentUser,
  clearUser: () => {
    currentUser = null;
  }
};
