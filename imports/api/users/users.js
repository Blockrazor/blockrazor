Meteor.users.friendlySlugs({
  slugFrom: 'username',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
}) // create a URL friendly slug from the username