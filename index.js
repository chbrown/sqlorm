/*jslint node: true */

function extend(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
  return target;
}

/** new Model(propertiesObject: any)

Model, the class, is instantiated by pretty plain objects. The benefit of sqlorm
lies in the Model classmethods.

Instances of Model may have any number of properties. The Model class, though,
has the classmethods defined below, and copies of it should also have the
following properties defined directly on the class:

* db: sqlcmd.Connection
* table: string
* columns: string[]

*/
var Model = exports.Model = {}; // this constructor should never actually be called

/** Model.all(whereEqual_obj: object,
              callback: (error: Error, records: T[]))

Find all records that precisely match pattern.

Be careful! Susceptible to injection: pattern's keys are not escaped.
*/
Model.all = function(whereEqual_obj, callback) {
  var Model = this;
  this.db.Select(Model.table)
  .whereEqual(whereEqual_obj)
  .execute(function(err, rows) {
    if (err) return callback(err);

    var records = rows.map(function(row) {
      // return Object.create(Model.prototype, row);
      return new Model(row);
    });
    callback(null, records);
  });
};

/** Model.first(whereEqual_obj: object,
                callback: (error: Error, record: T))

Find the first record that matches pattern, or null.

Susceptible to injection: pattern's keys are not escaped.
*/
Model.first = function(whereEqual_obj, callback) {
  var Model = this;
  this.db.Select(this.table)
  .limit(1)
  .whereEqual(whereEqual_obj)
  .execute(function(err, rows) {
    if (err) return callback(err, null);
    if (rows.length === 0) return callback(null, null);

    var record = new Model(rows[0]);
    callback(null, record);
  });
};

/** Model.one(whereEqual_obj: object,
              callback: (error: Error, record?: T))

Like Model.first(), finds the first record that matches pattern, but calls back
with an error if nothing can be found.

Susceptible to injection: pattern's keys are not escaped.
*/
Model.one = function(whereEqual_obj, callback) {
  var Model = this;
  this.first(whereEqual_obj, function(err, record) {
    if (err) return callback(err);
    if (record === null) {
      var message = 'Could not find match in ' + Model.table + '.';
      return callback(new Error(message));
    }

    callback(null, record);
  });
};

/** Model.insert(obj: object,
                 callback: (error: Error, row: Object)

Insert single record with the given fields.
*/
Model.insert = function(fields, callback) {
  this.db.Insert(this.table)
  .set(fields)
  .execute(function(err, rows) {
    if (err) return callback(err);

    callback(null, rows[0]);
  });
};

/** Model.delete(whereEqual_obj: object,
                 callback: (error?: Error))

Delete the records matching the given pattern.
*/
Model.delete = function(pattern, callback) {
  this.db.Delete(this.table)
  .whereEqual(pattern)
  .execute(callback);
};

/** sqlorm.createModel(db: sqlcmd.Connection,
                       table: string,
                       columns: string[])

Returns a new Class that has these classmethods:

* .all()
* .first()
* .one()
* .insert()
* .delete()

*/
exports.createModel = function(db, table, columns) {
  var NewModel = function(propertiesObject) {
    // Model.call(this, obj);
    extend(this, propertiesObject);
  };
  NewModel.db = db;
  NewModel.table = table;
  NewModel.columns = columns;

  // There are no prototype methods on Model, so we don't need to inherit it;
  //   copying over the properties from Model is enough.
  // util.inherits(NewModel, Model);
  extend(NewModel, Model);

  return NewModel;
};
