import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char2 = arrayString[i];
    if (char2 === "\\") {
      i++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char2 = arrayString[i];
    if (char2 === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size2) {
    return new PgArrayBuilder(this.config.name, this, size2);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size2) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size2;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/version.js
var version = "0.45.4";

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values2) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values2)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values2[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values2)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values2[p.value.name]);
    }
    return p;
  });
}
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field: field2 }, columnIndex) => {
      let decoder;
      if (is(field2, Column)) {
        decoder = field2;
      } else if (is(field2, SQL)) {
        decoder = field2.decoder;
      } else if (is(field2, Subquery)) {
        decoder = field2._.sql.decoder;
      } else {
        decoder = field2.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field2, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field2.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field2.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field2]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field2, Column) || is(field2, SQL) || is(field2, SQL.Aliased) || is(field2, Subquery)) {
      result.push({ path: newPath, field: field2 });
    } else if (is(field2, Table)) {
      result.push(...orderSelectedFields(field2[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field2, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values2) {
  const entries = Object.entries(values2).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b2) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b2
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
};
var PgBigInt53 = class extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
};
var PgBigInt64 = class extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
};
var PgBigSerial53 = class extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
};
var PgBigSerial64 = class extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigserial(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
};
var PgBoolean = class extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
};
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name, config) {
    super(name, "string", "PgChar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(
      table,
      this.config
    );
  }
};
var PgChar = class extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgCharBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
};
var PgCidr = class extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
};
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
};
var PgCustomColumn = class extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b2) => {
    const { name, config } = getColumnNameAndConfig(a, b2);
    return new PgCustomColumnBuilder(name, config, customTypeParams);
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(value);
    return value;
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return value.toISOString().slice(0, -14);
  }
};
function date(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
};
var PgDoublePrecision = class extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
};
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
};
var PgInet = class extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
};
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
};
var PgInteger = class extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
};
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
};
var PgInterval = class extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
};
function interval(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgIntervalBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
};
var PgLineTuple = class extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b2, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b2), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
};
var PgLineABCBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
};
var PgLineABC = class extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b2, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b2), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
};
function line(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (!config?.mode || config.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
};
var PgMacaddr = class extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
};
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
};
var PgMacaddr8 = class extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
};
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericNumberBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericNumberBuilder";
  constructor(name, precision, scale) {
    super(name, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericNumber(
      table,
      this.config
    );
  }
};
var PgNumericNumber = class extends PgColumn {
  static [entityKind] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericBigIntBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBigIntBuilder";
  constructor(name, precision, scale) {
    super(name, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericBigInt(
      table,
      this.config
    );
  }
};
var PgNumericBigInt = class extends PgColumn {
  static [entityKind] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
function numeric(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  const mode = config?.mode;
  return mode === "number" ? new PgNumericNumberBuilder(name, config?.precision, config?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name, config?.precision, config?.scale) : new PgNumericBuilder(name, config?.precision, config?.scale);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
};
var PgPointTuple = class extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
};
var PgPointObject = class extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
};
function point(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (!config?.mode || config.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer2 = new ArrayBuffer(8);
  const view = new DataView(buffer2);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
};
var PgGeometry = class extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
};
var PgGeometryObject = class extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
};
function geometry(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (!config?.mode || config.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
};
var PgReal = class extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
};
function real(name) {
  return new PgRealBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
};
var PgSerial = class extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
};
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
};
var PgSmallInt = class extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
};
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
};
var PgSmallSerial = class extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
};
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
};
var PgText = class extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
};
function text(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgTextBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function time(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(this.withTimezone ? value : value + "+0000");
    return value;
  }
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    const shortened = value.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const offset = value.getTimezoneOffset();
      const sign = offset <= 0 ? "+" : "-";
      return `${shortened}${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0")}`;
    }
    return shortened;
  }
};
function timestamp(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  if (config?.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name, config) {
    super(name, "string", "PgVarchar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(
      table,
      this.config
    );
  }
};
var PgVarchar = class extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b2 = {}) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgVarcharBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
};
var PgBinaryVector = class extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
};
function bit(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgBinaryVectorBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
};
var PgHalfVector = class extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function halfvec(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgHalfVectorBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
};
var PgSparseVector = class extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
};
function sparsevec(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgSparseVectorBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(
      table,
      this.config
    );
  }
};
var PgVector = class extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function vector(a, b2) {
  const { name, config } = getColumnNameAndConfig(a, b2);
  return new PgVectorBuilder(name, config);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values2) {
  if (Array.isArray(values2)) {
    if (values2.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values2.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values2, column)}`;
}
function notInArray(column, values2) {
  if (Array.isArray(values2)) {
    if (values2.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values2.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values2, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field2 = selectionItem.field;
      let decoder;
      if (is(field2, Column)) {
        decoder = field2;
      } else if (is(field2, SQL)) {
        decoder = field2.decoder;
      } else {
        decoder = field2.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
import os from "os";
import fs from "fs";

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/query.js
var originCache = /* @__PURE__ */ new Map();
var originStackCache = /* @__PURE__ */ new Map();
var originError = /* @__PURE__ */ Symbol("OriginError");
var CLOSE = {};
var Query = class extends Promise {
  constructor(strings, args, handler2, canceller, options = {}) {
    let resolve, reject;
    super((a, b2) => {
      resolve = a;
      reject = b2;
    });
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler2;
    this.canceller = canceller;
    this.options = options;
    this.state = null;
    this.statement = null;
    this.resolve = (x) => (this.active = false, resolve(x));
    this.reject = (x) => (this.active = false, reject(x));
    this.active = false;
    this.cancelled = null;
    this.executed = false;
    this.signature = "";
    this[originError] = this.handler.debug ? new Error() : this.tagged && cachedError(this.strings);
  }
  get origin() {
    return (this.handler.debug ? this[originError].stack : this.tagged && originStackCache.has(this.strings) ? originStackCache.get(this.strings) : originStackCache.set(this.strings, this[originError].stack).get(this.strings)) || "";
  }
  static get [Symbol.species]() {
    return Promise;
  }
  cancel() {
    return this.canceller && (this.canceller(this), this.canceller = null);
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve, reject) => {
            this.cursorFn = (value) => {
              resolve({ value, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = () => (this.active = false, resolve({ done: true }));
            this.reject = (x) => (this.active = false, reject(x));
          });
          this.execute();
          return promise;
        },
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  async handle() {
    !this.executed && (this.executed = true) && await 1 && this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then() {
    this.handle();
    return super.then.apply(this, arguments);
  }
  catch() {
    this.handle();
    return super.catch.apply(this, arguments);
  }
  finally() {
    this.handle();
    return super.finally.apply(this, arguments);
  }
};
function cachedError(xs) {
  if (originCache.has(xs))
    return originCache.get(xs);
  const x = Error.stackTraceLimit;
  Error.stackTraceLimit = 4;
  originCache.set(xs, new Error());
  Error.stackTraceLimit = x;
  return originCache.get(xs);
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/errors.js
var PostgresError = class extends Error {
  constructor(x) {
    super(x.message);
    this.name = this.constructor.name;
    Object.assign(this, x);
  }
};
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(x, options, socket) {
  const { host, port } = socket || options;
  const error = Object.assign(
    new Error("write " + x + " " + (options.path || host + ":" + port)),
    {
      code: x,
      errno: x,
      address: options.path || host
    },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error, connection);
  return error;
}
function postgres(x) {
  const error = new PostgresError(x);
  Error.captureStackTrace(error, postgres);
  return error;
}
function generic(code, message) {
  const error = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error, generic);
  return error;
}
function notSupported(x) {
  const error = Object.assign(
    new Error(x + " (B) is not supported"),
    {
      code: "MESSAGE_NOT_SUPPORTED",
      name: x
    }
  );
  Error.captureStackTrace(error, notSupported);
  return error;
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/types.js
var types = {
  string: {
    to: 25,
    from: null,
    // defaults to string
    serialize: (x) => "" + x
  },
  number: {
    to: 0,
    from: [21, 23, 26, 700, 701],
    serialize: (x) => "" + x,
    parse: (x) => +x
  },
  json: {
    to: 114,
    from: [114, 3802],
    serialize: (x) => JSON.stringify(x),
    parse: (x) => JSON.parse(x)
  },
  boolean: {
    to: 16,
    from: 16,
    serialize: (x) => x === true ? "t" : "f",
    parse: (x) => x === "t"
  },
  date: {
    to: 1184,
    from: [1082, 1114, 1184],
    serialize: (x) => (x instanceof Date ? x : new Date(x)).toISOString(),
    parse: (x) => new Date(x)
  },
  bytea: {
    to: 17,
    from: 17,
    serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
    parse: (x) => Buffer.from(x.slice(2), "hex")
  }
};
var NotTagged = class {
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
};
var Identifier = class extends NotTagged {
  constructor(value) {
    super();
    this.value = escapeIdentifier(value);
  }
};
var Parameter = class extends NotTagged {
  constructor(value, type, array) {
    super();
    this.value = value;
    this.type = type;
    this.array = array;
  }
};
var Builder = class extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
  build(before, parameters, types2, options) {
    const keyword = builders.map(([x, fn]) => ({ fn, i: before.search(x) })).sort((a, b2) => a.i - b2.i).pop();
    return keyword.i === -1 ? escapeIdentifiers(this.first, options) : keyword.fn(this.first, this.rest, parameters, types2, options);
  }
};
function handleValue(x, parameters, types2, options) {
  let value = x instanceof Parameter ? x.value : x;
  if (value === void 0) {
    x instanceof Parameter ? x.value = options.transform.undefined : value = x = options.transform.undefined;
    if (value === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
  }
  return "$" + types2.push(
    x instanceof Parameter ? (parameters.push(x.value), x.array ? x.array[x.type || inferType(x.value)] || x.type || firstIsString(x.value) : x.type) : (parameters.push(x), inferType(x))
  );
}
var defaultHandlers = typeHandlers(types);
function stringify(q, string, value, parameters, types2, options) {
  for (let i = 1; i < q.strings.length; i++) {
    string += stringifyValue(string, value, parameters, types2, options) + q.strings[i];
    value = q.args[i];
  }
  return string;
}
function stringifyValue(string, value, parameters, types2, o) {
  return value instanceof Builder ? value.build(string, parameters, types2, o) : value instanceof Query ? fragment(value, parameters, types2, o) : value instanceof Identifier ? value.value : value && value[0] instanceof Query ? value.reduce((acc, x) => acc + " " + fragment(x, parameters, types2, o), "") : handleValue(value, parameters, types2, o);
}
function fragment(q, parameters, types2, options) {
  q.fragment = true;
  return stringify(q, q.strings[0], q.args[0], parameters, types2, options);
}
function valuesBuilder(first, parameters, types2, columns, options) {
  return first.map(
    (row) => "(" + columns.map(
      (column) => stringifyValue("values", row[column], parameters, types2, options)
    ).join(",") + ")"
  ).join(",");
}
function values(first, rest, parameters, types2, options) {
  const multi = Array.isArray(first[0]);
  const columns = rest.length ? rest.flat() : Object.keys(multi ? first[0] : first);
  return valuesBuilder(multi ? first : [first], parameters, types2, columns, options);
}
function select(first, rest, parameters, types2, options) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return escapeIdentifiers(first, options);
  let value;
  const columns = rest.length ? rest.flat() : Object.keys(first);
  return columns.map((x) => {
    value = first[x];
    return (value instanceof Query ? fragment(value, parameters, types2, options) : value instanceof Identifier ? value.value : handleValue(value, parameters, types2, options)) + " as " + escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x);
  }).join(",");
}
var builders = Object.entries({
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  },
  select,
  as: select,
  returning: select,
  "\\(": select,
  update(first, rest, parameters, types2, options) {
    return (rest.length ? rest.flat() : Object.keys(first)).map(
      (x) => escapeIdentifier(options.transform.column.to ? options.transform.column.to(x) : x) + "=" + stringifyValue("values", first[x], parameters, types2, options)
    );
  },
  insert(first, rest, parameters, types2, options) {
    const columns = rest.length ? rest.flat() : Object.keys(Array.isArray(first) ? first[0] : first);
    return "(" + escapeIdentifiers(columns, options) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], parameters, types2, columns, options);
  }
}).map(([x, fn]) => [new RegExp("((?:^|[\\s(])" + x + "(?:$|[\\s(]))(?![\\s\\S]*\\1)", "i"), fn]);
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
var serializers = defaultHandlers.serializers;
var parsers = defaultHandlers.parsers;
function firstIsString(x) {
  if (Array.isArray(x))
    return firstIsString(x[0]);
  return typeof x === "string" ? 1009 : 0;
}
var mergeUserTypes = function(types2) {
  const user = typeHandlers(types2 || {});
  return {
    serializers: Object.assign({}, serializers, user.serializers),
    parsers: Object.assign({}, parsers, user.parsers)
  };
};
function typeHandlers(types2) {
  return Object.keys(types2).reduce((acc, k) => {
    types2[k].from && [].concat(types2[k].from).forEach((x) => acc.parsers[x] = types2[k].parse);
    if (types2[k].serialize) {
      acc.serializers[types2[k].to] = types2[k].serialize;
      types2[k].from && [].concat(types2[k].from).forEach((x) => acc.serializers[x] = types2[k].serialize);
    }
    return acc;
  }, { parsers: {}, serializers: {} });
}
function escapeIdentifiers(xs, { transform: { column } }) {
  return xs.map((x) => escapeIdentifier(column.to ? column.to(x) : x)).join(",");
}
var escapeIdentifier = function escape(str) {
  return '"' + str.replace(/"/g, '""').replace(/\./g, '"."') + '"';
};
var inferType = function inferType2(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? inferType2(x[0]) : 0;
};
var escapeBackslash = /\\/g;
var escapeQuote = /"/g;
function arrayEscape(x) {
  return x.replace(escapeBackslash, "\\\\").replace(escapeQuote, '\\"');
}
var arraySerializer = function arraySerializer2(xs, serializer, options, typarray) {
  if (Array.isArray(xs) === false)
    return xs;
  if (!xs.length)
    return "{}";
  const first = xs[0];
  const delimiter = typarray === 1020 ? ";" : ",";
  if (Array.isArray(first) && !first.type)
    return "{" + xs.map((x) => arraySerializer2(x, serializer, options, typarray)).join(delimiter) + "}";
  return "{" + xs.map((x) => {
    if (x === void 0) {
      x = options.transform.undefined;
      if (x === void 0)
        throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    }
    return x === null ? "null" : '"' + arrayEscape(serializer ? serializer(x.type ? x.value : x) : "" + x) + '"';
  }).join(delimiter) + "}";
};
var arrayParserState = {
  i: 0,
  char: null,
  str: "",
  quoted: false,
  last: 0
};
var arrayParser = function arrayParser2(x, parser, typarray) {
  arrayParserState.i = arrayParserState.last = 0;
  return arrayParserLoop(arrayParserState, x, parser, typarray);
};
function arrayParserLoop(s, x, parser, typarray) {
  const xs = [];
  const delimiter = typarray === 1020 ? ";" : ",";
  for (; s.i < x.length; s.i++) {
    s.char = x[s.i];
    if (s.quoted) {
      if (s.char === "\\") {
        s.str += x[++s.i];
      } else if (s.char === '"') {
        xs.push(parser ? parser(s.str) : s.str);
        s.str = "";
        s.quoted = x[s.i + 1] === '"';
        s.last = s.i + 2;
      } else {
        s.str += s.char;
      }
    } else if (s.char === '"') {
      s.quoted = true;
    } else if (s.char === "{") {
      s.last = ++s.i;
      xs.push(arrayParserLoop(s, x, parser, typarray));
    } else if (s.char === "}") {
      s.quoted = false;
      s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
      break;
    } else if (s.char === delimiter && s.p !== "}" && s.p !== '"') {
      xs.push(parser ? parser(x.slice(s.last, s.i)) : x.slice(s.last, s.i));
      s.last = s.i + 1;
    }
    s.p = s.char;
  }
  s.last < s.i && xs.push(parser ? parser(x.slice(s.last, s.i + 1)) : x.slice(s.last, s.i + 1));
  return xs;
}
var toCamel = (x) => {
  let str = x[0];
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toPascal = (x) => {
  let str = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str;
};
var toKebab = (x) => x.replace(/_/g, "-");
var fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
var fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
var fromKebab = (x) => x.replace(/-/g, "_");
function createJsonTransform(fn) {
  return function jsonTransform(x, column) {
    return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
  };
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
import net from "net";
import tls from "tls";
import crypto2 from "crypto";
import Stream from "stream";
import { performance } from "perf_hooks";

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/result.js
var Result = class extends Array {
  constructor() {
    super();
    Object.defineProperties(this, {
      count: { value: null, writable: true },
      state: { value: null, writable: true },
      command: { value: null, writable: true },
      columns: { value: null, writable: true },
      statement: { value: null, writable: true }
    });
  }
  static get [Symbol.species]() {
    return Array;
  }
};

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/queue.js
var queue_default = Queue;
function Queue(initial = []) {
  let xs = initial.slice();
  let index2 = 0;
  return {
    get length() {
      return xs.length - index2;
    },
    remove: (x) => {
      const index3 = xs.indexOf(x);
      return index3 === -1 ? null : (xs.splice(index3, 1), x);
    },
    push: (x) => (xs.push(x), x),
    shift: () => {
      const out = xs[index2++];
      if (index2 === xs.length) {
        index2 = 0;
        xs = [];
      } else {
        xs[index2 - 1] = void 0;
      }
      return out;
    }
  };
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/bytes.js
var size = 256;
var buffer = Buffer.allocUnsafe(size);
var messages = "BCcDdEFfHPpQSX".split("").reduce((acc, x) => {
  const v = x.charCodeAt(0);
  acc[x] = () => {
    buffer[0] = v;
    b.i = 5;
    return b;
  };
  return acc;
}, {});
var b = Object.assign(reset, messages, {
  N: String.fromCharCode(0),
  i: 0,
  inc(x) {
    b.i += x;
    return b;
  },
  str(x) {
    const length = Buffer.byteLength(x);
    fit(length);
    b.i += buffer.write(x, b.i, length, "utf8");
    return b;
  },
  i16(x) {
    fit(2);
    buffer.writeUInt16BE(x, b.i);
    b.i += 2;
    return b;
  },
  i32(x, i) {
    if (i || i === 0) {
      buffer.writeUInt32BE(x, i);
      return b;
    }
    fit(4);
    buffer.writeUInt32BE(x, b.i);
    b.i += 4;
    return b;
  },
  z(x) {
    fit(x);
    buffer.fill(0, b.i, b.i + x);
    b.i += x;
    return b;
  },
  raw(x) {
    buffer = Buffer.concat([buffer.subarray(0, b.i), x]);
    b.i = buffer.length;
    return b;
  },
  end(at = 1) {
    buffer.writeUInt32BE(b.i - at, at);
    const out = buffer.subarray(0, b.i);
    b.i = 0;
    buffer = Buffer.allocUnsafe(size);
    return out;
  }
});
var bytes_default = b;
function fit(x) {
  if (buffer.length - b.i < x) {
    const prev = buffer, length = prev.length;
    buffer = Buffer.allocUnsafe(length + (length >> 1) + x);
    prev.copy(buffer);
  }
}
function reset() {
  b.i = 0;
  return b;
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/connection.js
var connection_default = Connection;
var uid = 1;
var Sync = bytes_default().S().end();
var Flush = bytes_default().H().end();
var SSLRequest = bytes_default().i32(8).i32(80877103).end(8);
var ExecuteUnnamed = Buffer.concat([bytes_default().E().str(bytes_default.N).i32(0).end(), Sync]);
var DescribeUnnamed = bytes_default().D().str("S").str(bytes_default.N).end();
var noop = () => {
};
var retryRoutines = /* @__PURE__ */ new Set([
  "FetchPreparedStatement",
  "RevalidateCachedQuery",
  "transformAssignedExpr"
]);
var errorFields = {
  83: "severity_local",
  // S
  86: "severity",
  // V
  67: "code",
  // C
  77: "message",
  // M
  68: "detail",
  // D
  72: "hint",
  // H
  80: "position",
  // P
  112: "internal_position",
  // p
  113: "internal_query",
  // q
  87: "where",
  // W
  115: "schema_name",
  // s
  116: "table_name",
  // t
  99: "column_name",
  // c
  100: "data type_name",
  // d
  110: "constraint_name",
  // n
  70: "file",
  // F
  76: "line",
  // L
  82: "routine"
  // R
};
function Connection(options, queues = {}, { onopen = noop, onend = noop, onclose = noop } = {}) {
  const {
    sslnegotiation,
    ssl,
    max,
    user,
    host,
    port,
    database,
    parsers: parsers2,
    transform,
    onnotice,
    onnotify,
    onparameter,
    max_pipeline,
    keep_alive,
    backoff: backoff2,
    target_session_attrs
  } = options;
  const sent = queue_default(), id = uid++, backend = { pid: null, secret: null }, idleTimer = timer(end, options.idle_timeout), lifeTimer = timer(end, options.max_lifetime), connectTimer = timer(connectTimedOut, options.connect_timeout);
  let socket = null, cancelMessage, errorResponse = null, result = new Result(), incoming = Buffer.alloc(0), needsTypes = options.fetch_types, backendParameters = {}, statements = {}, statementId = Math.random().toString(36).slice(2), statementCount = 1, closedTime = 0, remaining = 0, hostIndex = 0, retries = 0, length = 0, delay = 0, rows = 0, serverSignature = null, nextWriteTimer = null, terminated = false, incomings = null, results = null, initial = null, ending = null, stream = null, chunk = null, ended = null, nonce = null, query = null, final = null;
  const connection2 = {
    queue: queues.closed,
    idleTimer,
    connect(query2) {
      initial = query2;
      reconnect();
    },
    terminate,
    execute,
    cancel,
    end,
    count: 0,
    id
  };
  queues.closed && queues.closed.push(connection2);
  return connection2;
  async function createSocket() {
    let x;
    try {
      x = options.socket ? await Promise.resolve(options.socket(options)) : new net.Socket();
    } catch (e) {
      error(e);
      return;
    }
    x.on("error", error);
    x.on("close", closed);
    x.on("drain", drain);
    return x;
  }
  async function cancel({ pid, secret }, resolve, reject) {
    try {
      cancelMessage = bytes_default().i32(16).i32(80877102).i32(pid).i32(secret).end(16);
      await connect();
      socket.once("error", reject);
      socket.once("close", resolve);
    } catch (error2) {
      reject(error2);
    }
  }
  function execute(q) {
    if (terminated)
      return queryError(q, Errors.connection("CONNECTION_DESTROYED", options));
    if (stream)
      return queryError(q, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    if (q.cancelled)
      return;
    try {
      q.state = backend;
      query ? sent.push(q) : (query = q, query.active = true);
      build(q);
      return write(toBuffer(q)) && !q.describeFirst && !q.cursorFn && sent.length < max_pipeline && (!q.options.onexecute || q.options.onexecute(connection2));
    } catch (error2) {
      sent.length === 0 && write(Sync);
      errored(error2);
      return true;
    }
  }
  function toBuffer(q) {
    if (q.parameters.length >= 65534)
      throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
    return q.options.simple ? bytes_default().Q().str(q.statement.string + bytes_default.N).end() : q.describeFirst ? Buffer.concat([describe(q), Flush]) : q.prepare ? q.prepared ? prepared(q) : Buffer.concat([describe(q), prepared(q)]) : unnamed(q);
  }
  function describe(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types, q.statement.name),
      Describe("S", q.statement.name)
    ]);
  }
  function prepared(q) {
    return Buffer.concat([
      Bind(q.parameters, q.statement.types, q.statement.name, q.cursorName),
      q.cursorFn ? Execute("", q.cursorRows) : ExecuteUnnamed
    ]);
  }
  function unnamed(q) {
    return Buffer.concat([
      Parse(q.statement.string, q.parameters, q.statement.types),
      DescribeUnnamed,
      prepared(q)
    ]);
  }
  function build(q) {
    const parameters = [], types2 = [];
    const string = stringify(q, q.strings[0], q.args[0], parameters, types2, options);
    !q.tagged && q.args.forEach((x) => handleValue(x, parameters, types2, options));
    q.prepare = options.prepare && ("prepare" in q.options ? q.options.prepare : true);
    q.string = string;
    q.signature = q.prepare && types2 + string;
    q.onlyDescribe && delete statements[q.signature];
    q.parameters = q.parameters || parameters;
    q.prepared = q.prepare && q.signature in statements;
    q.describeFirst = q.onlyDescribe || parameters.length && !q.prepared;
    q.statement = q.prepared ? statements[q.signature] : { string, types: types2, name: q.prepare ? statementId + statementCount++ : "" };
    typeof options.debug === "function" && options.debug(id, string, parameters, types2);
  }
  function write(x, fn) {
    chunk = chunk ? Buffer.concat([chunk, x]) : Buffer.from(x);
    if (fn || chunk.length >= 1024)
      return nextWrite(fn);
    nextWriteTimer === null && (nextWriteTimer = setImmediate(nextWrite));
    return true;
  }
  function nextWrite(fn) {
    const x = socket.write(chunk, fn);
    nextWriteTimer !== null && clearImmediate(nextWriteTimer);
    chunk = nextWriteTimer = null;
    return x;
  }
  function connectTimedOut() {
    errored(Errors.connection("CONNECT_TIMEOUT", options, socket));
    socket.destroy();
  }
  async function secure() {
    if (sslnegotiation !== "direct") {
      write(SSLRequest);
      const canSSL = await new Promise((r) => socket.once("data", (x) => r(x[0] === 83)));
      if (!canSSL && ssl === "prefer")
        return connected();
    }
    const options2 = {
      socket,
      servername: net.isIP(socket.host) ? void 0 : socket.host
    };
    if (sslnegotiation === "direct")
      options2.ALPNProtocols = ["postgresql"];
    if (ssl === "require" || ssl === "allow" || ssl === "prefer")
      options2.rejectUnauthorized = false;
    else if (typeof ssl === "object")
      Object.assign(options2, ssl);
    socket.removeAllListeners();
    socket = tls.connect(options2);
    socket.on("secureConnect", connected);
    socket.on("error", error);
    socket.on("close", closed);
    socket.on("drain", drain);
  }
  function drain() {
    !query && onopen(connection2);
  }
  function data(x) {
    if (incomings) {
      incomings.push(x);
      remaining -= x.length;
      if (remaining > 0)
        return;
    }
    incoming = incomings ? Buffer.concat(incomings, length - remaining) : incoming.length === 0 ? x : Buffer.concat([incoming, x], incoming.length + x.length);
    while (incoming.length > 4) {
      length = incoming.readUInt32BE(1);
      if (length >= incoming.length) {
        remaining = length - incoming.length;
        incomings = [incoming];
        break;
      }
      try {
        handle(incoming.subarray(0, length + 1));
      } catch (e) {
        query && (query.cursorFn || query.describeFirst) && write(Sync);
        errored(e);
      }
      incoming = incoming.subarray(length + 1);
      remaining = 0;
      incomings = null;
    }
  }
  async function connect() {
    terminated = false;
    backendParameters = {};
    socket || (socket = await createSocket());
    if (!socket)
      return;
    connectTimer.start();
    if (options.socket)
      return ssl ? secure() : connected();
    socket.on("connect", ssl ? secure : connected);
    if (options.path)
      return socket.connect(options.path);
    socket.ssl = ssl;
    socket.connect(port[hostIndex], host[hostIndex]);
    socket.host = host[hostIndex];
    socket.port = port[hostIndex];
    hostIndex = (hostIndex + 1) % port.length;
  }
  function reconnect() {
    setTimeout(connect, closedTime ? Math.max(0, closedTime + delay - performance.now()) : 0);
  }
  function connected() {
    try {
      statements = {};
      needsTypes = options.fetch_types;
      statementId = Math.random().toString(36).slice(2);
      statementCount = 1;
      lifeTimer.start();
      socket.on("data", data);
      keep_alive && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * keep_alive);
      const s = StartupMessage();
      write(s);
    } catch (err) {
      error(err);
    }
  }
  function error(err) {
    if (connection2.queue === queues.connecting && options.host[retries + 1])
      return;
    errored(err);
    while (sent.length)
      queryError(sent.shift(), err);
  }
  function errored(err) {
    stream && (stream.destroy(err), stream = null);
    query && queryError(query, err);
    initial && (queryError(initial, err), initial = null);
  }
  function queryError(query2, err) {
    if (query2.reserve)
      return query2.reject(err);
    if (!err || typeof err !== "object")
      err = new Error(err);
    "query" in err || "parameters" in err || Object.defineProperties(err, {
      stack: { value: err.stack + query2.origin.replace(/.*\n/, "\n"), enumerable: options.debug },
      query: { value: query2.string, enumerable: options.debug },
      parameters: { value: query2.parameters, enumerable: options.debug },
      args: { value: query2.args, enumerable: options.debug },
      types: { value: query2.statement && query2.statement.types, enumerable: options.debug }
    });
    query2.reject(err);
  }
  function end() {
    return ending || (!connection2.reserved && onend(connection2), !connection2.reserved && !initial && !query && sent.length === 0 ? (terminate(), new Promise((r) => socket && socket.readyState !== "closed" ? socket.once("close", r) : r())) : ending = new Promise((r) => ended = r));
  }
  function terminate() {
    terminated = true;
    if (stream || query || initial || sent.length)
      error(Errors.connection("CONNECTION_DESTROYED", options));
    clearImmediate(nextWriteTimer);
    if (socket) {
      socket.removeListener("data", data);
      socket.removeListener("connect", connected);
      socket.readyState === "open" && socket.end(bytes_default().X().end());
    }
    ended && (ended(), ending = ended = null);
  }
  async function closed(hadError) {
    incoming = Buffer.alloc(0);
    remaining = 0;
    incomings = null;
    clearImmediate(nextWriteTimer);
    socket.removeListener("data", data);
    socket.removeListener("connect", connected);
    idleTimer.cancel();
    lifeTimer.cancel();
    connectTimer.cancel();
    socket.removeAllListeners();
    socket = null;
    if (initial)
      return reconnect();
    !hadError && (query || sent.length) && error(Errors.connection("CONNECTION_CLOSED", options, socket));
    closedTime = performance.now();
    hadError && options.shared.retries++;
    delay = (typeof backoff2 === "function" ? backoff2(options.shared.retries) : backoff2) * 1e3;
    onclose(connection2, Errors.connection("CONNECTION_CLOSED", options, socket));
  }
  function handle(xs, x = xs[0]) {
    (x === 68 ? DataRow : (
      // D
      x === 100 ? CopyData : (
        // d
        x === 65 ? NotificationResponse : (
          // A
          x === 83 ? ParameterStatus : (
            // S
            x === 90 ? ReadyForQuery : (
              // Z
              x === 67 ? CommandComplete : (
                // C
                x === 50 ? BindComplete : (
                  // 2
                  x === 49 ? ParseComplete : (
                    // 1
                    x === 116 ? ParameterDescription : (
                      // t
                      x === 84 ? RowDescription : (
                        // T
                        x === 82 ? Authentication : (
                          // R
                          x === 110 ? NoData : (
                            // n
                            x === 75 ? BackendKeyData : (
                              // K
                              x === 69 ? ErrorResponse : (
                                // E
                                x === 115 ? PortalSuspended : (
                                  // s
                                  x === 51 ? CloseComplete : (
                                    // 3
                                    x === 71 ? CopyInResponse : (
                                      // G
                                      x === 78 ? NoticeResponse : (
                                        // N
                                        x === 72 ? CopyOutResponse : (
                                          // H
                                          x === 99 ? CopyDone : (
                                            // c
                                            x === 73 ? EmptyQueryResponse : (
                                              // I
                                              x === 86 ? FunctionCallResponse : (
                                                // V
                                                x === 118 ? NegotiateProtocolVersion : (
                                                  // v
                                                  x === 87 ? CopyBothResponse : (
                                                    // W
                                                    /* c8 ignore next */
                                                    UnknownMessage
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ))(xs);
  }
  function DataRow(x) {
    let index2 = 7;
    let length2;
    let column;
    let value;
    const row = query.isRaw ? new Array(query.statement.columns.length) : {};
    for (let i = 0; i < query.statement.columns.length; i++) {
      column = query.statement.columns[i];
      length2 = x.readInt32BE(index2);
      index2 += 4;
      value = length2 === -1 ? null : query.isRaw === true ? x.subarray(index2, index2 += length2) : column.parser === void 0 ? x.toString("utf8", index2, index2 += length2) : column.parser.array === true ? column.parser(x.toString("utf8", index2 + 1, index2 += length2)) : column.parser(x.toString("utf8", index2, index2 += length2));
      query.isRaw ? row[i] = query.isRaw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
    }
    query.forEachFn ? query.forEachFn(transform.row.from ? transform.row.from(row) : row, result) : result[rows++] = transform.row.from ? transform.row.from(row) : row;
  }
  function ParameterStatus(x) {
    const [k, v] = x.toString("utf8", 5, x.length - 1).split(bytes_default.N);
    backendParameters[k] = v;
    if (options.parameters[k] !== v) {
      options.parameters[k] = v;
      onparameter && onparameter(k, v);
    }
  }
  function ReadyForQuery(x) {
    if (query) {
      if (errorResponse) {
        query.retried ? errored(query.retried) : query.prepared && retryRoutines.has(errorResponse.routine) ? retry(query, errorResponse) : errored(errorResponse);
      } else {
        query.resolve(results || result);
      }
    } else if (errorResponse) {
      errored(errorResponse);
    }
    query = results = errorResponse = null;
    result = new Result();
    connectTimer.cancel();
    if (initial) {
      if (target_session_attrs) {
        if (!backendParameters.in_hot_standby || !backendParameters.default_transaction_read_only)
          return fetchState();
        else if (tryNext(target_session_attrs, backendParameters))
          return terminate();
      }
      if (needsTypes) {
        initial.reserve && (initial = null);
        return fetchArrayTypes();
      }
      initial && !initial.reserve && execute(initial);
      options.shared.retries = retries = 0;
      initial = null;
      return;
    }
    while (sent.length && (query = sent.shift()) && (query.active = true, query.cancelled))
      Connection(options).cancel(query.state, query.cancelled.resolve, query.cancelled.reject);
    if (query)
      return;
    connection2.reserved ? !connection2.reserved.release && x[5] === 73 ? ending ? terminate() : (connection2.reserved = null, onopen(connection2)) : connection2.reserved() : ending ? terminate() : onopen(connection2);
  }
  function CommandComplete(x) {
    rows = 0;
    for (let i = x.length - 1; i > 0; i--) {
      if (x[i] === 32 && x[i + 1] < 58 && result.count === null)
        result.count = +x.toString("utf8", i + 1, x.length - 1);
      if (x[i - 1] >= 65) {
        result.command = x.toString("utf8", 5, i);
        result.state = backend;
        break;
      }
    }
    final && (final(), final = null);
    if (result.command === "BEGIN" && max !== 1 && !connection2.reserved)
      return errored(Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1"));
    if (query.options.simple)
      return BindComplete();
    if (query.cursorFn) {
      result.count && query.cursorFn(result);
      write(Sync);
    }
  }
  function ParseComplete() {
    query.parsing = false;
  }
  function BindComplete() {
    !result.statement && (result.statement = query.statement);
    result.columns = query.statement.columns;
  }
  function ParameterDescription(x) {
    const length2 = x.readUInt16BE(5);
    for (let i = 0; i < length2; ++i)
      !query.statement.types[i] && (query.statement.types[i] = x.readUInt32BE(7 + i * 4));
    query.prepare && (statements[query.signature] = query.statement);
    query.describeFirst && !query.onlyDescribe && (write(prepared(query)), query.describeFirst = false);
  }
  function RowDescription(x) {
    if (result.command) {
      results = results || [result];
      results.push(result = new Result());
      result.count = null;
      query.statement.columns = null;
    }
    const length2 = x.readUInt16BE(5);
    let index2 = 7;
    let start;
    query.statement.columns = Array(length2);
    for (let i = 0; i < length2; ++i) {
      start = index2;
      while (x[index2++] !== 0) ;
      const table = x.readUInt32BE(index2);
      const number = x.readUInt16BE(index2 + 4);
      const type = x.readUInt32BE(index2 + 6);
      query.statement.columns[i] = {
        name: transform.column.from ? transform.column.from(x.toString("utf8", start, index2 - 1)) : x.toString("utf8", start, index2 - 1),
        parser: parsers2[type],
        table,
        number,
        type
      };
      index2 += 18;
    }
    result.statement = query.statement;
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  async function Authentication(x, type = x.readUInt32BE(5)) {
    (type === 3 ? AuthenticationCleartextPassword : type === 5 ? AuthenticationMD5Password : type === 10 ? SASL : type === 11 ? SASLContinue : type === 12 ? SASLFinal : type !== 0 ? UnknownAuth : noop)(x, type);
  }
  async function AuthenticationCleartextPassword() {
    const payload = await Pass();
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function AuthenticationMD5Password(x) {
    const payload = "md5" + await md5(
      Buffer.concat([
        Buffer.from(await md5(await Pass() + user)),
        x.subarray(9)
      ])
    );
    write(
      bytes_default().p().str(payload).z(1).end()
    );
  }
  async function SASL() {
    nonce = (await crypto2.randomBytes(18)).toString("base64");
    bytes_default().p().str("SCRAM-SHA-256" + bytes_default.N);
    const i = bytes_default.i;
    write(bytes_default.inc(4).str("n,,n=*,r=" + nonce).i32(bytes_default.i - i - 4, i).end());
  }
  async function SASLContinue(x) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {});
    const saltedPassword = await crypto2.pbkdf2Sync(
      await Pass(),
      Buffer.from(res.s, "base64"),
      parseInt(res.i),
      32,
      "sha256"
    );
    const clientKey = await hmac(saltedPassword, "Client Key");
    const auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=biws,r=" + res.r;
    serverSignature = (await hmac(await hmac(saltedPassword, "Server Key"), auth)).toString("base64");
    const payload = "c=biws,r=" + res.r + ",p=" + xor(
      clientKey,
      Buffer.from(await hmac(await sha256(clientKey), auth))
    ).toString("base64");
    write(
      bytes_default().p().str(payload).end()
    );
  }
  function SASLFinal(x) {
    if (x.toString("utf8", 9).split(bytes_default.N, 1)[0].slice(2) === serverSignature)
      return;
    errored(Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature"));
    socket.destroy();
  }
  function Pass() {
    return Promise.resolve(
      typeof options.pass === "function" ? options.pass() : options.pass
    );
  }
  function NoData() {
    result.statement = query.statement;
    result.statement.columns = [];
    if (query.onlyDescribe)
      return query.resolve(query.statement), write(Sync);
  }
  function BackendKeyData(x) {
    backend.pid = x.readUInt32BE(5);
    backend.secret = x.readUInt32BE(9);
  }
  async function fetchArrayTypes() {
    needsTypes = false;
    const types2 = await new Query([`
      select b.oid, b.typarray
      from pg_catalog.pg_type a
      left join pg_catalog.pg_type b on b.oid = a.typelem
      where a.typcategory = 'A'
      group by b.oid, b.typarray
      order by b.oid
    `], [], execute);
    types2.forEach(({ oid, typarray }) => addArrayType(oid, typarray));
  }
  function addArrayType(oid, typarray) {
    if (!!options.parsers[typarray] && !!options.serializers[typarray]) return;
    const parser = options.parsers[oid];
    options.shared.typeArrayMap[oid] = typarray;
    options.parsers[typarray] = (xs) => arrayParser(xs, parser, typarray);
    options.parsers[typarray].array = true;
    options.serializers[typarray] = (xs) => arraySerializer(xs, options.serializers[oid], options, typarray);
  }
  function tryNext(x, xs) {
    return x === "read-write" && xs.default_transaction_read_only === "on" || x === "read-only" && xs.default_transaction_read_only === "off" || x === "primary" && xs.in_hot_standby === "on" || x === "standby" && xs.in_hot_standby === "off" || x === "prefer-standby" && xs.in_hot_standby === "off" && options.host[retries];
  }
  function fetchState() {
    const query2 = new Query([`
      show transaction_read_only;
      select pg_catalog.pg_is_in_recovery()
    `], [], execute, null, { simple: true });
    query2.resolve = ([[a], [b2]]) => {
      backendParameters.default_transaction_read_only = a.transaction_read_only;
      backendParameters.in_hot_standby = b2.pg_is_in_recovery ? "on" : "off";
    };
    query2.execute();
  }
  function ErrorResponse(x) {
    if (query) {
      (query.cursorFn || query.describeFirst) && write(Sync);
      errorResponse = Errors.postgres(parseError(x));
    } else {
      errored(Errors.postgres(parseError(x)));
    }
  }
  function retry(q, error2) {
    delete statements[q.signature];
    q.retried = error2;
    execute(q);
  }
  function NotificationResponse(x) {
    if (!onnotify)
      return;
    let index2 = 9;
    while (x[index2++] !== 0) ;
    onnotify(
      x.toString("utf8", 9, index2 - 1),
      x.toString("utf8", index2, x.length - 1)
    );
  }
  async function PortalSuspended() {
    try {
      const x = await Promise.resolve(query.cursorFn(result));
      rows = 0;
      x === CLOSE ? write(Close(query.portal)) : (result = new Result(), write(Execute("", query.cursorRows)));
    } catch (err) {
      write(Sync);
      query.reject(err);
    }
  }
  function CloseComplete() {
    result.count && query.cursorFn(result);
    query.resolve(result);
  }
  function CopyInResponse() {
    stream = new Stream.Writable({
      autoDestroy: true,
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
        stream = null;
      }
    });
    query.resolve(stream);
  }
  function CopyOutResponse() {
    stream = new Stream.Readable({
      read() {
        socket.resume();
      }
    });
    query.resolve(stream);
  }
  function CopyBothResponse() {
    stream = new Stream.Duplex({
      autoDestroy: true,
      read() {
        socket.resume();
      },
      /* c8 ignore next 11 */
      write(chunk2, encoding, callback) {
        socket.write(bytes_default().d().raw(chunk2).end(), callback);
      },
      destroy(error2, callback) {
        callback(error2);
        socket.write(bytes_default().f().str(error2 + bytes_default.N).end());
        stream = null;
      },
      final(callback) {
        socket.write(bytes_default().c().end());
        final = callback;
      }
    });
    query.resolve(stream);
  }
  function CopyData(x) {
    stream && (stream.push(x.subarray(5)) || socket.pause());
  }
  function CopyDone() {
    stream && stream.push(null);
    stream = null;
  }
  function NoticeResponse(x) {
    onnotice ? onnotice(parseError(x)) : console.log(parseError(x));
  }
  function EmptyQueryResponse() {
  }
  function FunctionCallResponse() {
    errored(Errors.notSupported("FunctionCallResponse"));
  }
  function NegotiateProtocolVersion() {
    errored(Errors.notSupported("NegotiateProtocolVersion"));
  }
  function UnknownMessage(x) {
    console.error("Postgres.js : Unknown Message:", x[0]);
  }
  function UnknownAuth(x, type) {
    console.error("Postgres.js : Unknown Auth:", type);
  }
  function Bind(parameters, types2, statement = "", portal = "") {
    let prev, type;
    bytes_default().B().str(portal + bytes_default.N).str(statement + bytes_default.N).i16(0).i16(parameters.length);
    parameters.forEach((x, i) => {
      if (x === null)
        return bytes_default.i32(4294967295);
      type = types2[i];
      parameters[i] = x = type in options.serializers ? options.serializers[type](x) : "" + x;
      prev = bytes_default.i;
      bytes_default.inc(4).str(x).i32(bytes_default.i - prev - 4, prev);
    });
    bytes_default.i16(0);
    return bytes_default.end();
  }
  function Parse(str, parameters, types2, name = "") {
    bytes_default().P().str(name + bytes_default.N).str(str + bytes_default.N).i16(parameters.length);
    parameters.forEach((x, i) => bytes_default.i32(types2[i] || 0));
    return bytes_default.end();
  }
  function Describe(x, name = "") {
    return bytes_default().D().str(x).str(name + bytes_default.N).end();
  }
  function Execute(portal = "", rows2 = 0) {
    return Buffer.concat([
      bytes_default().E().str(portal + bytes_default.N).i32(rows2).end(),
      Flush
    ]);
  }
  function Close(portal = "") {
    return Buffer.concat([
      bytes_default().C().str("P").str(portal + bytes_default.N).end(),
      bytes_default().S().end()
    ]);
  }
  function StartupMessage() {
    return cancelMessage || bytes_default().inc(4).i16(3).z(2).str(
      Object.entries(Object.assign(
        {
          user,
          database,
          client_encoding: "UTF8"
        },
        options.connection
      )).filter(([, v]) => v).map(([k, v]) => k + bytes_default.N + v).join(bytes_default.N)
    ).z(2).end(0);
  }
}
function parseError(x) {
  const error = {};
  let start = 5;
  for (let i = 5; i < x.length - 1; i++) {
    if (x[i] === 0) {
      error[errorFields[x[start]]] = x.toString("utf8", start + 1, i);
      start = i + 1;
    }
  }
  return error;
}
function md5(x) {
  return crypto2.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
  return crypto2.createHmac("sha256", key).update(x).digest();
}
function sha256(x) {
  return crypto2.createHash("sha256").update(x).digest();
}
function xor(a, b2) {
  const length = Math.max(a.length, b2.length);
  const buffer2 = Buffer.allocUnsafe(length);
  for (let i = 0; i < length; i++)
    buffer2[i] = a[i] ^ b2[i];
  return buffer2;
}
function timer(fn, seconds) {
  seconds = typeof seconds === "function" ? seconds() : seconds;
  if (!seconds)
    return { cancel: noop, start: noop };
  let timer2;
  return {
    cancel() {
      timer2 && (clearTimeout(timer2), timer2 = null);
    },
    start() {
      timer2 && clearTimeout(timer2);
      timer2 = setTimeout(done, seconds * 1e3, arguments);
    }
  };
  function done(args) {
    fn.apply(null, args);
    timer2 = null;
  }
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/subscribe.js
var noop2 = () => {
};
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), slot = "postgresjs_" + Math.random().toString(36).slice(2), state = {};
  let connection2, stream, ended = false;
  const sql2 = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    fetch_types: false,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: async function() {
      if (ended)
        return;
      stream = null;
      state.pid = state.secret = void 0;
      connected(await init(sql2, slot, options.publications));
      subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
    },
    no_subscribe: true
  });
  const end = sql2.end, close = sql2.close;
  sql2.end = async () => {
    ended = true;
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return end();
  };
  sql2.close = async () => {
    stream && await new Promise((r) => (stream.once("close", r), stream.end()));
    return close();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop2, onerror = noop2) {
    event = parseEvent(event);
    if (!connection2)
      connection2 = init(sql2, slot, options.publications);
    const subscriber = { fn, onsubscribe };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then((x) => {
      connected(x);
      onsubscribe();
      stream && stream.on("error", onerror);
      return { unsubscribe, state, sql: sql2 };
    });
  }
  function connected(x) {
    stream = x.stream;
    state.pid = x.state.pid;
    state.secret = x.state.secret;
  }
  async function init(sql3, slot2, publications) {
    if (!publications)
      throw new Error("Missing publication names");
    const xs = await sql3.unsafe(
      `CREATE_REPLICATION_SLOT ${slot2} TEMPORARY LOGICAL pgoutput NOEXPORT_SNAPSHOT`
    );
    const [x] = xs;
    const stream2 = await sql3.unsafe(
      `START_REPLICATION SLOT ${slot2} LOGICAL ${x.consistent_point} (proto_version '1', publication_names '${publications}')`
    ).writable();
    const state2 = {
      lsn: Buffer.concat(x.consistent_point.split("/").map((x2) => Buffer.from(("00000000" + x2).slice(-8), "hex")))
    };
    stream2.on("data", data);
    stream2.on("error", error);
    stream2.on("close", sql3.close);
    return { stream: stream2, state: xs.state };
    function error(e) {
      console.error("Unexpected error during logical streaming - reconnecting", e);
    }
    function data(x2) {
      if (x2[0] === 119) {
        parse(x2.subarray(25), state2, sql3.options.parsers, handle, options.transform);
      } else if (x2[0] === 107 && x2[17]) {
        state2.lsn = x2.subarray(1, 9);
        pong();
      }
    }
    function handle(a, b2) {
      const path2 = b2.relation.schema + "." + b2.relation.table;
      call("*", a, b2);
      call("*:" + path2, a, b2);
      b2.relation.keys.length && call("*:" + path2 + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
      call(b2.command, a, b2);
      call(b2.command + ":" + path2, a, b2);
      b2.relation.keys.length && call(b2.command + ":" + path2 + "=" + b2.relation.keys.map((x2) => a[x2.name]), a, b2);
    }
    function pong() {
      const x2 = Buffer.alloc(34);
      x2[0] = "r".charCodeAt(0);
      x2.fill(state2.lsn, 1);
      x2.writeBigInt64BE(BigInt(Date.now() - Date.UTC(2e3, 0, 1)) * BigInt(1e3), 25);
      stream2.write(x2);
    }
  }
  function call(x, a, b2) {
    subscribers.has(x) && subscribers.get(x).forEach(({ fn }) => fn(a, b2, x));
  }
}
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / BigInt(1e3)));
}
function parse(x, state, parsers2, handle, transform) {
  const char2 = (acc, [k, v]) => (acc[k.charCodeAt(0)] = v, acc);
  Object.entries({
    R: (x2) => {
      let i = 1;
      const r = state[x2.readUInt32BE(i)] = {
        schema: x2.toString("utf8", i += 4, i = x2.indexOf(0, i)) || "pg_catalog",
        table: x2.toString("utf8", i + 1, i = x2.indexOf(0, i + 1)),
        columns: Array(x2.readUInt16BE(i += 2)),
        keys: []
      };
      i += 2;
      let columnIndex = 0, column;
      while (i < x2.length) {
        column = r.columns[columnIndex++] = {
          key: x2[i++],
          name: transform.column.from ? transform.column.from(x2.toString("utf8", i, i = x2.indexOf(0, i))) : x2.toString("utf8", i, i = x2.indexOf(0, i)),
          type: x2.readUInt32BE(i += 1),
          parser: parsers2[x2.readUInt32BE(i)],
          atttypmod: x2.readUInt32BE(i += 4)
        };
        column.key && r.keys.push(column);
        i += 4;
      }
    },
    Y: () => {
    },
    // Type
    O: () => {
    },
    // Origin
    B: (x2) => {
      state.date = Time(x2.readBigInt64BE(9));
      state.lsn = x2.subarray(1, 9);
    },
    I: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      const { row } = tuples(x2, relation.columns, i += 7, transform);
      handle(row, {
        command: "insert",
        relation
      });
    },
    D: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      handle(
        key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform).row : null,
        {
          command: "delete",
          relation,
          key
        }
      );
    },
    U: (x2) => {
      let i = 1;
      const relation = state[x2.readUInt32BE(i)];
      i += 4;
      const key = x2[i] === 75;
      const xs = key || x2[i] === 79 ? tuples(x2, relation.columns, i += 3, transform) : null;
      xs && (i = xs.i);
      const { row } = tuples(x2, relation.columns, i + 3, transform);
      handle(row, {
        command: "update",
        relation,
        key,
        old: xs && xs.row
      });
    },
    T: () => {
    },
    // Truncate,
    C: () => {
    }
    // Commit
  }).reduce(char2, {})[x[0]](x);
}
function tuples(x, columns, xi, transform) {
  let type, column, value;
  const row = transform.raw ? new Array(columns.length) : {};
  for (let i = 0; i < columns.length; i++) {
    type = x[xi++];
    column = columns[i];
    value = type === 110 ? null : type === 117 ? void 0 : column.parser === void 0 ? x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)) : column.parser.array === true ? column.parser(x.toString("utf8", xi + 5, xi += 4 + x.readUInt32BE(xi))) : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    transform.raw ? row[i] = transform.raw === true ? value : transform.value.from ? transform.value.from(value, column) : value : row[column.name] = transform.value.from ? transform.value.from(value, column) : value;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const xs = x.match(/^(\*|insert|update|delete)?:?([^.]+?\.?[^=]+)?=?(.+)?/i) || [];
  if (!xs)
    throw new Error("Malformed subscribe pattern: " + x);
  const [, command, path2, key] = xs;
  return (command || "*") + (path2 ? ":" + (path2.indexOf(".") === -1 ? "public." + path2 : path2) : "") + (key ? "=" + key : "");
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql2, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve, reject) => {
    await sql2.begin(async (sql3) => {
      let finish;
      !oid && ([{ oid }] = await sql3`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql3`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql3`select lo_close(${fd})`.then(finish),
        tell: () => sql3`select lo_tell64(${fd})`,
        read: (x) => sql3`select loread(${fd}, ${x}) as data`,
        write: (x) => sql3`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql3`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql3`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql3`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve(lo);
      return new Promise(async (r) => finish = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start = 0,
        end = Infinity
      } = {}) {
        let max = end - start;
        start && await lo.seek(start);
        return new Stream2.Readable({
          highWaterMark,
          async read(size2) {
            const l = size2 > max ? size2 - max : size2;
            max -= size2;
            const [{ data }] = await lo.read(l);
            this.push(data);
            if (data.length < size2)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start = 0
      } = {}) {
        start && await lo.seek(start);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}

// ../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: (x) => BigInt(x),
    // eslint-disable-line
    serialize: (x) => x.toString()
  }
});
var src_default = Postgres;
function Postgres(a, b2) {
  const options = parseOptions(a, b2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options });
  let ending = false;
  const queries = queue_default(), connecting = queue_default(), reserved = queue_default(), closed = queue_default(), ended = queue_default(), open = queue_default(), busy = queue_default(), full = queue_default(), queues = { connecting, reserved, closed, ended, open, busy, full };
  const connections = [...Array(options.max)].map(() => connection_default(options, queues, { onopen, onend, onclose }));
  const sql2 = Sql(handler2);
  Object.assign(sql2, {
    get parameters() {
      return options.parameters;
    },
    largeObject: largeObject.bind(null, sql2),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen,
    begin,
    close,
    end
  });
  return sql2;
  function Sql(handler3) {
    handler3.debug = options.debug;
    Object.entries(options.types).reduce((acc, [name, type]) => {
      acc[name] = (x) => new Parameter(x, type.to);
      return acc;
    }, typed);
    Object.assign(sql3, {
      types: typed,
      typed,
      unsafe,
      notify,
      array,
      json: json2,
      file
    });
    return sql3;
    function typed(value, type) {
      return new Parameter(value, type);
    }
    function sql3(strings, ...args) {
      const query = strings && Array.isArray(strings.raw) ? new Query(strings, args, handler3, cancel) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
      return query;
    }
    function unsafe(string, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([string], args, handler3, cancel, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
    function file(path2, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const query = new Query([], args, (query2) => {
        fs.readFile(path2, "utf8", (err, string) => {
          if (err)
            return query2.reject(err);
          query2.strings = [string];
          handler3(query2);
        });
      }, cancel, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
      return query;
    }
  }
  async function listen(name, fn, onlisten) {
    const listener = { fn, onlisten };
    const sql3 = listen.sql || (listen.sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      onclose() {
        Object.entries(listen.channels).forEach(([name2, { listeners }]) => {
          delete listen.channels[name2];
          Promise.all(listeners.map((l) => listen(name2, l.fn, l.onlisten).catch(() => {
          })));
        });
      },
      onnotify(c, x) {
        c in listen.channels && listen.channels[c].listeners.forEach((l) => l.fn(x));
      }
    }));
    const channels = listen.channels || (listen.channels = {}), exists2 = name in channels;
    if (exists2) {
      channels[name].listeners.push(listener);
      const result2 = await channels[name].result;
      listener.onlisten && listener.onlisten();
      return { state: result2.state, unlisten };
    }
    channels[name] = { result: sql3`listen ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`, listeners: [listener] };
    const result = await channels[name].result;
    listener.onlisten && listener.onlisten();
    return { state: result.state, unlisten };
    async function unlisten() {
      if (name in channels === false)
        return;
      channels[name].listeners = channels[name].listeners.filter((x) => x !== listener);
      if (channels[name].listeners.length)
        return;
      delete channels[name];
      return sql3`unlisten ${sql3.unsafe('"' + name.replace(/"/g, '""') + '"')}`;
    }
  }
  async function notify(channel, payload) {
    return await sql2`select pg_notify(${channel}, ${"" + payload})`;
  }
  async function reserve() {
    const queue = queue_default();
    const c = open.length ? open.shift() : await new Promise((resolve, reject) => {
      const query = { reserve: resolve, reject };
      queries.push(query);
      closed.length && connect(closed.shift(), query);
    });
    move(c, reserved);
    c.reserved = () => queue.length ? c.execute(queue.shift()) : move(c, reserved);
    c.reserved.release = true;
    const sql3 = Sql(handler3);
    sql3.release = () => {
      c.reserved = null;
      onopen(c);
    };
    return sql3;
    function handler3(q) {
      c.queue === full ? queue.push(q) : c.execute(q) || move(c, full);
    }
  }
  async function begin(options2, fn) {
    !fn && (fn = options2, options2 = "");
    const queries2 = queue_default();
    let savepoints = 0, connection2, prepare = null;
    try {
      await sql2.unsafe("begin " + options2.replace(/[^a-z ]/ig, ""), [], { onexecute }).execute();
      return await Promise.race([
        scope(connection2, fn),
        new Promise((_, reject) => connection2.onclose = reject)
      ]);
    } catch (error) {
      throw error;
    }
    async function scope(c, fn2, name) {
      const sql3 = Sql(handler3);
      sql3.savepoint = savepoint;
      sql3.prepare = (x) => prepare = x.replace(/[^a-z0-9$-_. ]/gi);
      let uncaughtError, result;
      name && await sql3`savepoint ${sql3(name)}`;
      try {
        result = await new Promise((resolve, reject) => {
          const x = fn2(sql3);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
        });
        if (uncaughtError)
          throw uncaughtError;
      } catch (e) {
        await (name ? sql3`rollback to ${sql3(name)}` : sql3`rollback`);
        throw e instanceof PostgresError && e.code === "25P02" && uncaughtError || e;
      }
      if (!name) {
        prepare ? await sql3`prepare transaction '${sql3.unsafe(prepare)}'` : await sql3`commit`;
      }
      return result;
      function savepoint(name2, fn3) {
        if (name2 && Array.isArray(name2.raw))
          return savepoint((sql4) => sql4.apply(sql4, arguments));
        arguments.length === 1 && (fn3 = name2, name2 = null);
        return scope(c, fn3, "s" + savepoints++ + (name2 ? "_" + name2 : ""));
      }
      function handler3(q) {
        q.catch((e) => uncaughtError || (uncaughtError = e));
        c.queue === full ? queries2.push(q) : c.execute(q) || move(c, full);
      }
    }
    function onexecute(c) {
      connection2 = c;
      move(c, reserved);
      c.reserved = () => queries2.length ? c.execute(queries2.shift()) : move(c, reserved);
    }
  }
  function move(c, queue) {
    c.queue.remove(c);
    queue.push(c);
    c.queue = queue;
    queue === open ? c.idleTimer.start() : c.idleTimer.cancel();
    return c;
  }
  function json2(x) {
    return new Parameter(x, 3802);
  }
  function array(x, type) {
    if (!Array.isArray(x))
      return array(Array.from(arguments));
    return new Parameter(x, type || (x.length ? inferType(x) || 25 : 0), options.shared.typeArrayMap);
  }
  function handler2(query) {
    if (ending)
      return query.reject(Errors.connection("CONNECTION_ENDED", options, options));
    if (open.length)
      return go(open.shift(), query);
    if (closed.length)
      return connect(closed.shift(), query);
    busy.length ? go(busy.shift(), query) : queries.push(query);
  }
  function go(c, query) {
    return c.execute(query) ? move(c, busy) : move(c, full);
  }
  function cancel(query) {
    return new Promise((resolve, reject) => {
      query.state ? query.active ? connection_default(options).cancel(query.state, resolve, reject) : query.cancelled = { resolve, reject } : (queries.remove(query), query.cancelled = true, query.reject(Errors.generic("57014", "canceling statement due to user request")), resolve());
    });
  }
  async function end({ timeout = null } = {}) {
    if (ending)
      return ending;
    await 1;
    let timer2;
    return ending = Promise.race([
      new Promise((r) => timeout !== null && (timer2 = setTimeout(destroy, timeout * 1e3, r))),
      Promise.all(connections.map((c) => c.end()).concat(
        listen.sql ? listen.sql.end({ timeout: 0 }) : [],
        subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : []
      ))
    ]).then(() => clearTimeout(timer2));
  }
  async function close() {
    await Promise.all(connections.map((c) => c.end()));
  }
  async function destroy(resolve) {
    await Promise.all(connections.map((c) => c.terminate()));
    while (queries.length)
      queries.shift().reject(Errors.connection("CONNECTION_DESTROYED", options));
    resolve();
  }
  function connect(c, query) {
    move(c, connecting);
    c.connect(query);
    return c;
  }
  function onend(c) {
    move(c, ended);
  }
  function onopen(c) {
    if (queries.length === 0)
      return move(c, open);
    let max = Math.ceil(queries.length / (connecting.length + 1)), ready = true;
    while (ready && queries.length && max-- > 0) {
      const query = queries.shift();
      if (query.reserve)
        return query.reserve(c);
      ready = c.execute(query);
    }
    ready ? move(c, busy) : move(c, full);
  }
  function onclose(c, e) {
    move(c, closed);
    c.reserved = null;
    c.onclose && (c.onclose(e), c.onclose = null);
    options.onclose && options.onclose(c.id);
    queries.length && connect(c, queries.shift());
  }
}
function parseOptions(a, b2) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b2 : a) || {}, { url, multihost } = parseUrl(a), query = [...url.searchParams].reduce((a2, [b3, c]) => (a2[b3] = c, a2), {}), host = o.hostname || o.host || multihost || url.hostname || env.PGHOST || "localhost", port = o.port || url.port || env.PGPORT || 5432, user = o.user || o.username || url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query.sslrootcert === "system" && (query.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    ssl: false,
    sslnegotiation: null,
    idle_timeout: null,
    connect_timeout: 30,
    max_lifetime,
    max_pipeline: 100,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    publications: "alltables",
    target_session_attrs: null
  };
  return {
    host: Array.isArray(host) ? host : host.split(",").map((x) => x.split(":")[0]),
    port: Array.isArray(port) ? port : host.split(",").map((x) => parseInt(x.split(":")[1] || port)),
    path: o.path || host.indexOf("/") > -1 && host + "/.s.PGSQL." + port,
    database: o.database || o.db || (url.pathname || "").slice(1) || env.PGDATABASE || user,
    user,
    pass: o.pass || o.password || url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d]) => {
        const value = k in o ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : env["PG" + k.toUpperCase()] || d;
        acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0, typeArrayMap: {} },
    ...mergeUserTypes(o.types)
  };
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() } };
  let host = url;
  host = host.slice(host.indexOf("://") + 3).split(/[?/]/)[0];
  host = decodeURIComponent(host.slice(host.indexOf("@") + 1));
  const urlObj = new URL(url.replace(host, host.split(",")[0]));
  return {
    url: {
      username: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams
    },
    multihost: host.indexOf(",") > -1 && host
  };
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/indexes.js
var IndexBuilderOn = class {
  constructor(unique, name) {
    this.unique = unique;
    this.name = name;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      false,
      this.name
    );
  }
  onOnly(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = it.defaultConfig;
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name
    );
  }
  /**
   * Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
   *
   * If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
   *
   * **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
   *
   * @param method The name of the index method to be used
   * @param columns
   * @returns
   */
  using(method, ...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name,
      method
    );
  }
};
var IndexBuilder = class {
  static [entityKind] = "PgIndexBuilder";
  /** @internal */
  config;
  constructor(columns, unique, only, name, method = "btree") {
    this.config = {
      name,
      columns,
      unique,
      only,
      method
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  with(obj) {
    this.config.with = obj;
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static [entityKind] = "PgIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(false, name);
}
function uniqueIndex(name) {
  return new IndexBuilderOn(true, name);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
  static [entityKind] = "PgViewBase";
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
  static [entityKind] = "PgDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  async migrate(migrations, session, config) {
    const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const onUpdateFnResult = col.onUpdateFn?.();
      const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[PgTable.Symbol.Name];
    const tableSchema = table[PgTable.Symbol.Schema];
    const origTableName = table[PgTable.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = sql`${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field: field2 }, i) => {
      const chunk = [];
      if (is(field2, SQL.Aliased) && field2.isSelectionField) {
        chunk.push(sql.identifier(field2.fieldAlias));
      } else if (is(field2, SQL.Aliased) || is(field2, SQL)) {
        const query = is(field2, SQL.Aliased) ? field2.sql : field2;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field2, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field2.fieldAlias)}`);
        }
      } else if (is(field2, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field2)));
        } else {
          chunk.push(field2);
        }
      } else if (is(field2, Subquery)) {
        const entries = Object.entries(field2._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v) => entry.mapFromDriverValue(v) } : entry.sql.decoder;
          if (fieldDecoder) {
            field2._.sql.decoder = fieldDecoder;
          }
        }
        chunk.push(field2);
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index2, joinMeta] of joins.entries()) {
      if (index2 === 0) {
        joinsArray.push(sql` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
      const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
      if (is(table, PgTable)) {
        const tableName = table[PgTable.Symbol.Name];
        const tableSchema = table[PgTable.Symbol.Schema];
        const origTableName = table[PgTable.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else if (is(table, View)) {
        const viewName = table[ViewBaseConfig].name;
        const viewSchema = table[ViewBaseConfig].schema;
        const origViewName = table[ViewBaseConfig].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else {
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table}${onSql}`
        );
      }
      if (index2 < joins.length - 1) {
        joinsArray.push(sql` `);
      }
    }
    return sql.join(joinsArray);
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
      if (table[Table.Symbol.Schema]) {
        fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
      }
      return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` nowait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select: select2, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql.identifier(this.casing.getColumnCasing(column))
    );
    if (select2) {
      const select22 = valuesOrSelect;
      if (is(select22, SQL)) {
        valuesSqlList.push(select22);
      } else {
        valuesSqlList.push(select22.getSQL());
      }
    } else {
      const values2 = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values2.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values2.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? sql`overriding system value ` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp) || is(encoder, PgTimestampString)) {
      return "timestamp";
    } else if (is(encoder, PgDate) || is(encoder, PgDateString)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field2, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field2 in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field2);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field2 of selectedColumns) {
        const column = tableConfig.columns[field2];
        fieldsSelection.push({ tsKey: field2, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field22, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field22, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field2 = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field: field2,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field2 = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field22, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field22, SQL.Aliased) ? field22.sql : field22
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field2 = sql`coalesce(json_agg(${field2}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field2.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field22 }) => ({
          path: [],
          field: is(field22, Column) ? aliasedTableColumn(field22, tableAlias) : field22
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    const src = source;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(src, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(src._.selectedFields).map((key) => [key, src[key]])
      );
    } else if (is(src, PgViewBase)) {
      fields = src[ViewBaseConfig].selectedFields;
    } else if (is(src, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(src);
    }
    return new PgSelectBase({
      table: src,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType, lateral) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName, lateral });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left", false);
  /**
   * Executes a `left join lateral` operation by adding subquery to the current query.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  leftJoinLateral = this.createJoin("left", true);
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right", false);
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner", false);
  /**
   * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  innerJoinLateral = this.createJoin("inner", true);
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full", false);
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross", false);
  /**
   * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
   *
   * @param table the query to join.
   */
  crossJoinLateral = this.createJoin("cross", true);
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(config) {
    this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
    return this;
  }
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config, dialect, joinsNotNullableMap, authToken, cacheConfig, usedTables } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const { fields } = config;
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true, void 0, {
        type: "select",
        tables: [...usedTables]
      }, cacheConfig);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select2) => ({
      type,
      isAll,
      rightSelect: select2
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, PgDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select2(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select: select2, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/utils.js
function extractUsedTable(table) {
  if (is(table, PgTable)) {
    return [table[Schema] ? `${table[Schema]}.${table[Table.Symbol.BaseName]}` : table[Table.Symbol.BaseName]];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  cacheConfig;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entityKind] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values2) {
    values2 = Array.isArray(values2) ? values2 : [values2];
    if (values2.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values2.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select2 = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select2, SQL) && !haveSameKeys(this.table[Columns], select2._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select2, this.session, this.dialect, this.withList, true);
  }
};
var PgInsertBase = class extends QueryPromise {
  constructor(table, values2, session, dialect, withList, select2, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values: values2, withList, select: select2, overridingSystemValue_ };
  }
  static [entityKind] = "PgInsert";
  config;
  cacheConfig;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
      const whereSql = config.where ? sql` where ${config.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
    this.config.onConflict = sql`(${sql.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values2) {
    return new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values2),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
};
var PgUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entityKind] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  cacheConfig;
  from(source) {
    const src = source;
    const tableName = getTableLikeName(src);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = src;
    return this;
  }
  getTableLikeFields(table) {
    if (is(table, PgTable)) {
      return table[Table.Symbol.Columns];
    } else if (is(table, Subquery)) {
      return table._.selectedFields;
    }
    return table[ViewBaseConfig].selectedFields;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from && !is(this.config.from, SQL) ? this.getTableLikeFields(this.config.from) : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
      if (this.config.from) {
        const tableName = getTableLikeName(this.config.from);
        if (typeof tableName === "string" && this.config.from && !is(this.config.from, SQL)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = getTableLikeName(join.table);
          if (typeof tableName2 === "string" && !is(join.table, SQL)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true, void 0, {
      type: "insert",
      tables: extractUsedTable(this.config.table)
    }, this.cacheConfig);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class _PgCountBuilder extends SQL {
  constructor(params) {
    super(_PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = _PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entityKind] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) as count from ${source}${sql.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var PgRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
  constructor(execute, sql2, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql2;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  $cache;
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select2(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select: select2, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
  constructor(query, cache, queryMetadata, cacheConfig) {
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
};
var PgSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql2, token) {
    const res = await this.execute(sql2, token);
    return Number(
      res[0]["count"]
    );
  }
};
var PgTransaction = class extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config) {
    const chunks = [];
    if (config.isolationLevel) {
      chunks.push(`isolation level ${config.isolationLevel}`);
    }
    if (config.accessMode) {
      chunks.push(config.accessMode);
    }
    if (typeof config.deferrable === "boolean") {
      chunks.push(config.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config)}`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/postgres-js/session.js
var PostgresJsPreparedQuery = class extends PgPreparedQuery {
  constructor(client, queryString, params, logger, cache, queryMetadata, cacheConfig, fields, _isResponseInArrayMode, prepare, customResultMapper) {
    super({ sql: queryString, params }, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.queryString = queryString;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.prepare = prepare;
    this.customResultMapper = customResultMapper;
  }
  static [entityKind] = "PostgresJsPreparedQuery";
  async execute(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      const { fields, queryString: query, client, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return tracer.startActiveSpan("drizzle.driver.execute", () => {
          return this.queryWithCache(query, params, async () => {
            return await client.unsafe(query, params, {
              prepare: this.prepare
            });
          });
        });
      }
      const rows = await tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": query,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(query, params, async () => {
          return await client.unsafe(query, params, {
            prepare: this.prepare
          }).values();
        });
      });
      return tracer.startActiveSpan("drizzle.mapResponse", () => {
        return customResultMapper ? customResultMapper(rows) : rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
      });
    });
  }
  all(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async (span) => {
      const params = fillPlaceholders(this.params, placeholderValues);
      span?.setAttributes({
        "drizzle.query.text": this.queryString,
        "drizzle.query.params": JSON.stringify(params)
      });
      this.logger.logQuery(this.queryString, params);
      return tracer.startActiveSpan("drizzle.driver.execute", () => {
        span?.setAttributes({
          "drizzle.query.text": this.queryString,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.queryWithCache(this.queryString, params, async () => {
          return this.client.unsafe(this.queryString, params, {
            prepare: this.prepare
          });
        });
      });
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var PostgresJsSession = class _PostgresJsSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "PostgresJsSession";
  logger;
  cache;
  prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new PostgresJsPreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      isResponseInArrayMode,
      name !== void 0,
      customResultMapper
    );
  }
  query(query, params) {
    this.logger.logQuery(query, params);
    return this.client.unsafe(query, params).values();
  }
  queryObjects(query, params) {
    return this.client.unsafe(query, params);
  }
  transaction(transaction, config) {
    return this.client.begin(async (client) => {
      const session = new _PostgresJsSession(
        client,
        this.dialect,
        this.schema,
        this.options
      );
      const tx = new PostgresJsTransaction(this.dialect, session, this.schema);
      if (config) {
        await tx.setTransaction(config);
      }
      return transaction(tx);
    });
  }
};
var PostgresJsTransaction = class _PostgresJsTransaction extends PgTransaction {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema, nestedIndex);
    this.session = session;
  }
  static [entityKind] = "PostgresJsTransaction";
  transaction(transaction) {
    return this.session.client.savepoint((client) => {
      const session = new PostgresJsSession(
        client,
        this.dialect,
        this.schema,
        this.session.options
      );
      const tx = new _PostgresJsTransaction(this.dialect, session, this.schema);
      return transaction(tx);
    });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.4_kysely@0.29.8_postgres@3.4.9/node_modules/drizzle-orm/postgres-js/driver.js
var PostgresJsDatabase = class extends PgDatabase {
  static [entityKind] = "PostgresJsDatabase";
};
function construct(client, config = {}) {
  const transparentParser = (val) => val;
  for (const type of ["1184", "1082", "1083", "1114", "1182", "1185", "1115", "1231"]) {
    client.options.parsers[type] = transparentParser;
    client.options.serializers[type] = transparentParser;
  }
  client.options.serializers["114"] = transparentParser;
  client.options.serializers["3802"] = transparentParser;
  const dialect = new PgDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new PostgresJsSession(client, dialect, schema, { logger, cache: config.cache });
  const db2 = new PostgresJsDatabase(dialect, session, schema);
  db2.$client = client;
  db2.$cache = config.cache;
  if (db2.$cache) {
    db2.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db2;
}
function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = src_default(params[0]);
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection: connection2, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection2 === "object" && connection2.url !== void 0) {
      const { url, ...config } = connection2;
      const instance2 = src_default(url, config);
      return construct(instance2, drizzleConfig);
    }
    const instance = src_default(connection2);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({
      options: {
        parsers: {},
        serializers: {}
      }
    }, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// ../api/src/db/connection.ts
var LOCAL_DEFAULT = "postgres://planningpal:planningpal@localhost:5432/planningpal";
function resolveDatabaseUrls(env = process.env) {
  const pooled = env.DATABASE_URL?.trim() || LOCAL_DEFAULT;
  const direct = env.DIRECT_DATABASE_URL?.trim() || pooled;
  return { pooled, direct };
}
function sslMode(url) {
  return (url.searchParams.get("sslmode") || "").toLowerCase();
}
function isPoolerUrl(connectionString) {
  const url = new URL(connectionString);
  return url.hostname.includes("-pooler") || url.hostname.includes("pooler.supabase.com") || url.port === "6543" || url.searchParams.get("pgbouncer") === "true";
}
function sslOption(url) {
  const mode = sslMode(url);
  if (mode === "verify-full" || mode === "verify-ca") return "verify-full";
  if (mode === "require" || mode === "prefer" || mode === "allow") return "require";
  if (mode === "disable") return false;
  if (url.hostname.endsWith(".neon.tech") || url.hostname.endsWith(".supabase.co") || url.hostname.includes("-pooler") || url.hostname.includes("pooler.supabase.com")) {
    return "require";
  }
  return false;
}
function planConnection(connectionString, role, env = process.env) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(`Invalid ${role === "direct" ? "DIRECT_DATABASE_URL" : "DATABASE_URL"}`);
  }
  url.searchParams.delete("channel_binding");
  const hostIsPooler = isPoolerUrl(url.toString());
  const urlsDiffer = Boolean(env.DIRECT_DATABASE_URL?.trim()) && env.DIRECT_DATABASE_URL?.trim() !== env.DATABASE_URL?.trim();
  const pooled = role === "pooled" ? hostIsPooler || urlsDiffer : hostIsPooler;
  const requestedMax = Number(env.DATABASE_POOL_MAX || 10);
  const max = role === "direct" ? 1 : Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : 10;
  return {
    role,
    pooled,
    connectionString: url.toString(),
    options: {
      max,
      prepare: !pooled,
      ssl: sslOption(url),
      idle_timeout: 20,
      connect_timeout: 30
    }
  };
}
function createSql(role, env = process.env) {
  const urls = resolveDatabaseUrls(env);
  const plan = planConnection(role === "direct" ? urls.direct : urls.pooled, role, env);
  return src_default(plan.connectionString, plan.options);
}

// ../api/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activities: () => activities,
  auditLog: () => auditLog,
  campaignEngineLinks: () => campaignEngineLinks,
  campaignProviderMappings: () => campaignProviderMappings,
  campaignProviderSettings: () => campaignProviderSettings,
  campaigns: () => campaigns,
  councils: () => councils,
  crmLeads: () => crmLeads,
  customRoles: () => customRoles,
  decisionMakers: () => decisionMakers,
  demoRequests: () => demoRequests,
  inboxConversations: () => inboxConversations,
  inboxMessages: () => inboxMessages,
  ingestCursors: () => ingestCursors,
  intentEvents: () => intentEvents,
  invitations: () => invitations,
  invoices: () => invoices,
  leadFetches: () => leadFetches,
  localPlanningAuthorities: () => localPlanningAuthorities,
  mailLog: () => mailLog,
  meetings: () => meetings,
  organisations: () => organisations,
  personaTemplates: () => personaTemplates,
  pipelineRuns: () => pipelineRuns,
  planningApplications: () => planningApplications,
  rawPayloads: () => rawPayloads,
  savedSchemes: () => savedSchemes,
  sendingDomains: () => sendingDomains,
  teamMembers: () => teamMembers,
  telemetryEvents: () => telemetryEvents,
  users: () => users,
  workspaceLeads: () => workspaceLeads,
  workspaceMembers: () => workspaceMembers
});
var timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
};
var organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  tier: text("tier").notNull().default("CATEGORY_3"),
  planName: text("plan_name").notNull().default("Team Plan"),
  monthlyPrice: text("monthly_price").notNull().default("\xA32,950"),
  tradeSpecialisms: text("trade_specialisms").array().notNull().default(sql`ARRAY[]::text[]`),
  targetTerritories: text("target_territories").array().notNull().default(sql`ARRAY[]::text[]`),
  operatingRadiusMiles: integer("operating_radius_miles").notNull().default(25),
  signalAlerts: boolean("signal_alerts").notNull().default(true),
  dailySendLimit: integer("daily_send_limit").notNull().default(30),
  warmupEnabled: boolean("warmup_enabled").notNull().default(true),
  trackingDomain: text("tracking_domain").notNull().default("click.micraft-pipeline.co.uk"),
  logoUrl: text("logo_url").notNull().default(""),
  coverage: text("coverage").notNull().default(""),
  projectTypes: text("project_types").array().notNull().default(sql`ARRAY[]::text[]`),
  valueRanges: text("value_ranges").array().notNull().default(sql`ARRAY[]::text[]`),
  ribaStages: text("riba_stages").array().notNull().default(sql`ARRAY[]::text[]`),
  councilTargets: text("council_targets").array().notNull().default(sql`ARRAY[]::text[]`),
  portalSnapshot: jsonb("portal_snapshot").$type().notNull().default(sql`'{}'::jsonb`),
  active: boolean("active").notNull().default(true),
  slug: text("slug"),
  createdAt: timestamps.createdAt
});
var localPlanningAuthorities = pgTable(
  "local_planning_authorities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id"),
    name: text("name").notNull(),
    nation: text("nation").notNull(),
    region: text("region").notNull().default(""),
    county: text("county").notNull().default(""),
    type: text("type").notNull().default(""),
    gssCode: text("gss_code").notNull(),
    lpaGssCode: text("lpa_gss_code").notNull().default(""),
    planitAreaName: text("planit_area_name").notNull().default(""),
    planitAreaId: integer("planit_area_id"),
    planitCovered: text("planit_covered").notNull().default(""),
    planitScraperType: text("planit_scraper_type").notNull().default(""),
    planitLatestAppDate: date("planit_latest_app_date"),
    planitTotalApps: integer("planit_total_apps"),
    planningPortalUrl: text("planning_portal_url").notNull().default(""),
    website: text("website").notNull().default(""),
    status: text("status").notNull(),
    endDate: date("end_date"),
    successor: text("successor").notNull().default(""),
    notes: text("notes").notNull().default(""),
    coverage: text("coverage").notNull().default(""),
    planitQueryAreas: text("planit_query_areas").array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("local_planning_authorities_gss_idx").on(table.gssCode)]
);
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").references(() => organisations.id, { onDelete: "cascade" }),
  /** Supabase Auth user id (`auth.users.id`). No local credential table. */
  authUserId: text("auth_user_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  jobTitle: text("job_title").notNull().default("Account owner"),
  orgRole: text("org_role").notNull().default("member"),
  platformRole: text("platform_role"),
  apiToken: text("api_token").notNull().unique(),
  passwordHash: text("password_hash"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  emailPreferences: jsonb("email_preferences").$type().notNull().default(sql`'{}'::jsonb`),
  onboardingStep: text("onboarding_step").notNull().default("done"),
  onboardingSkipped: text("onboarding_skipped").array().notNull().default(sql`ARRAY[]::text[]`),
  checklistDismissed: boolean("checklist_dismissed").notNull().default(true),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  alertFrequency: text("alert_frequency").notNull().default("immediate"),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt
});
var workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  authUserId: text("auth_user_id").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id"),
  workspaceId: uuid("workspace_id"),
  action: text("action").notNull(),
  method: text("method").notNull().default(""),
  path: text("path").notNull().default(""),
  recordId: text("record_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamps.createdAt
});
var customRoles = pgTable("custom_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamps.createdAt
});
var councils = pgTable("councils", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  portalType: text("portal_type").notNull().default("UNKNOWN"),
  baseUrl: text("base_url").notNull().default(""),
  county: text("county").notNull().default(""),
  region: text("region").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamps.createdAt
});
var planningApplications = pgTable(
  "planning_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    councilId: uuid("council_id").references(() => councils.id, { onDelete: "set null" }),
    applicationRef: text("application_ref").notNull(),
    compositeHash: text("composite_hash").notNull(),
    projectId: text("project_id").notNull().default(""),
    heading: text("heading").notNull().default(""),
    proposal: text("proposal").notNull().default(""),
    valueFromM: numeric("value_from_m", { precision: 10, scale: 3 }).notNull().default("0"),
    valueToM: numeric("value_to_m", { precision: 10, scale: 3 }).notNull().default("0"),
    estValueFromM: numeric("est_value_from_m", { precision: 10, scale: 3 }).notNull().default("0"),
    estValueToM: numeric("est_value_to_m", { precision: 10, scale: 3 }).notNull().default("0"),
    siteRawAddress: text("site_raw_address").notNull().default(""),
    siteAddress: text("site_address").notNull().default(""),
    siteAddressLine1: text("site_address_line1").notNull().default(""),
    siteTown: text("site_town").notNull().default(""),
    siteCounty: text("site_county").notNull().default(""),
    postcode: text("postcode").notNull().default(""),
    outcode: text("outcode").notNull().default(""),
    localAuthority: text("local_authority").notNull().default(""),
    county: text("county").notNull().default(""),
    region: text("region").notNull().default(""),
    projectStage: text("project_stage").notNull().default(""),
    status: text("status").notNull().default("Approved"),
    primaryCategory: text("primary_category").notNull().default(""),
    propType: text("prop_type").notNull().default(""),
    publicationDate: text("publication_date").notNull().default(""),
    validationDate: date("validation_date"),
    decisionDate: date("decision_date"),
    portalUrl: text("portal_url").notNull().default(""),
    clientApplicantContact: text("client_applicant_contact").notNull().default(""),
    clientApplicant: text("client_applicant").notNull().default(""),
    clientApplicantRawAddress: text("client_applicant_raw_address").notNull().default(""),
    clientApplicantPhone: text("client_applicant_phone").notNull().default(""),
    architectAgentContact: text("architect_agent_contact").notNull().default(""),
    architectAgent: text("architect_agent").notNull().default(""),
    architectAgentRawAddress: text("architect_agent_raw_address").notNull().default(""),
    architectAgentPhone: text("architect_agent_phone").notNull().default(""),
    architectAgentEmail: text("architect_agent_email").notNull().default(""),
    sourceIndex: integer("source_index").notNull().default(0),
    sourceRecord: jsonb("source_record").$type().notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt
  },
  (table) => [
    uniqueIndex("planning_applications_authority_ref_idx").on(table.localAuthority, table.applicationRef),
    uniqueIndex("planning_applications_hash_idx").on(table.compositeHash),
    index("planning_applications_outcode_idx").on(table.outcode),
    index("planning_applications_region_idx").on(table.region),
    index("planning_applications_value_idx").on(table.valueToM)
  ]
);
var workspaceLeads = pgTable("workspace_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").notNull().references(() => planningApplications.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var leadFetches = pgTable("lead_fetches", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  days: integer("days").notNull(),
  status: text("status").notNull(),
  councils: text("councils").array().notNull().default(sql`ARRAY[]::text[]`),
  cursor: integer("cursor").notNull().default(0),
  found: integer("found").notNull().default(0),
  failedCouncils: text("failed_councils").array().notNull().default(sql`ARRAY[]::text[]`),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true })
});
var decisionMakers = pgTable("decision_makers", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => planningApplications.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  firmName: text("firm_name").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  rawAddress: text("raw_address").notNull().default(""),
  postcode: text("postcode").notNull().default(""),
  companyNumber: text("company_number"),
  confidenceLevel: text("confidence_level").notNull().default("STUDIO_MATCH"),
  createdAt: timestamps.createdAt
});
var savedSchemes = pgTable(
  "saved_schemes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").notNull().references(() => planningApplications.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt
  },
  (table) => [uniqueIndex("saved_schemes_org_app_idx").on(table.organisationId, table.applicationId)]
);
var crmLeads = pgTable(
  "crm_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").notNull().references(() => planningApplications.id, { onDelete: "cascade" }),
    stage: text("stage").notNull().default("STAGE_1_COLD"),
    intentScore: integer("intent_score").notNull().default(0),
    openCount: integer("open_count").notNull().default(0),
    deckDownloaded: boolean("deck_downloaded").notNull().default(false),
    assigneeName: text("assignee_name").notNull().default("Unassigned"),
    archived: boolean("archived").notNull().default(false),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    sdrNotes: text("sdr_notes").notNull().default(""),
    meetingBookedAt: timestamp("meeting_booked_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt
  },
  (table) => [index("crm_leads_client_stage_idx").on(table.organisationId, table.stage)]
);
var activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  crmLeadId: uuid("crm_lead_id").references(() => crmLeads.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => planningApplications.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  outcome: text("outcome").notNull().default(""),
  dueOn: date("due_on"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  shared: boolean("shared").notNull().default(false),
  createdAt: timestamps.createdAt
});
var campaignProviderSettings = pgTable("campaign_provider_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ciphertext: text("ciphertext").notNull(),
  hint: text("hint").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var campaignProviderMappings = pgTable("campaign_provider_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().unique().references(() => organisations.id, { onDelete: "cascade" }),
  providerWorkspaceId: text("provider_workspace_id").notNull(),
  status: text("status").notNull().default("mapped"),
  trackingDomain: text("tracking_domain").notNull().default(""),
  webhookStatus: text("webhook_status").notNull().default("unknown"),
  health: text("health").notNull().default("unknown"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  region: text("region").notNull().default("London"),
  contacts: integer("contacts").notNull().default(0),
  sent: integer("sent").notNull().default(0),
  openRate: text("open_rate").notNull().default("\u2014"),
  replyRate: text("reply_rate").notNull().default("\u2014"),
  meetings: integer("meetings").notNull().default(0),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt
});
var campaignEngineLinks = pgTable("campaign_engine_links", {
  campaignId: uuid("campaign_id").primaryKey().references(() => campaigns.id, { onDelete: "cascade" }),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  providerCampaignId: text("provider_campaign_id").notNull()
});
var sendingDomains = pgTable("sending_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  inboxes: integer("inboxes").notNull().default(0),
  health: text("health").notNull().default("Setup"),
  status: text("status").notNull().default("Verifying"),
  createdAt: timestamps.createdAt
});
var inboxConversations = pgTable("inbox_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  crmLeadId: uuid("crm_lead_id").references(() => crmLeads.id, { onDelete: "set null" }),
  subject: text("subject").notNull().default(""),
  preview: text("preview").notNull().default(""),
  unread: boolean("unread").notNull().default(true),
  timeLabel: text("time_label").notNull().default(""),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt
});
var inboxMessages = pgTable("inbox_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => inboxConversations.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(),
  senderName: text("sender_name").notNull().default(""),
  body: text("body").notNull().default(""),
  deliveryStatus: text("delivery_status").notNull().default("delivered"),
  timeLabel: text("time_label").notNull().default(""),
  workspaceId: uuid("workspace_id"),
  ownerUserId: uuid("owner_user_id"),
  shared: boolean("shared").notNull().default(true),
  createdAt: timestamps.createdAt
});
var intentEvents = pgTable("intent_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  crmLeadId: uuid("crm_lead_id").references(() => crmLeads.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  actorInitials: text("actor_initials").notNull().default(""),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  hot: boolean("hot").notNull().default(false),
  timeLabel: text("time_label").notNull().default(""),
  createdAt: timestamps.createdAt
});
var personaTemplates = pgTable("persona_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  stakeholder: text("stakeholder").notNull().default("Lead architect"),
  angle: text("angle").notNull().default(""),
  proofPoints: jsonb("proof_points").$type().notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamps.updatedAt
});
var meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  whenLabel: text("when_label").notNull(),
  firm: text("firm").notNull(),
  scheme: text("scheme").notNull(),
  kind: text("kind").notNull(),
  createdAt: timestamps.createdAt
});
var invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  issuedOn: text("issued_on").notNull(),
  number: text("number").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("Paid")
});
var demoRequests = pgTable("demo_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  trade: text("trade").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  fetched: integer("fetched").notNull().default(0),
  filteredOut: integer("filtered_out").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  csvPath: text("csv_path").notNull().default(""),
  cursorBefore: text("cursor_before").notNull().default(""),
  cursorAfter: text("cursor_after").notNull().default(""),
  message: text("message").notNull().default(""),
  options: jsonb("options").$type().notNull().default(sql`'{}'::jsonb`)
});
var rawPayloads = pgTable("raw_payloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").references(() => pipelineRuns.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  requestUrl: text("request_url").notNull().default(""),
  body: jsonb("body").$type().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var ingestCursors = pgTable("ingest_cursors", {
  source: text("source").primaryKey(),
  lastDifferent: text("last_different").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var telemetryEvents = pgTable("telemetry_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type().notNull(),
  createdAt: timestamps.createdAt
});
var invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var mailLog = pgTable("mail_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// ../api/src/db/client.ts
var sqlClient = createSql("pooled");
var db = drizzle(sqlClient, { schema: schema_exports });

// ../../packages/ingest/src/clean.ts
var POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
var BLANK_VALUES = /* @__PURE__ */ new Set(["", "see source", "unknown", "n/a", "na", "none", "null", "-"]);
function blank(value) {
  if (value === null || value === void 0) return "";
  const text2 = String(value).replace(/\s+/g, " ").trim();
  if (BLANK_VALUES.has(text2.toLowerCase())) return "";
  return text2;
}
function splitPostcode(address, explicit) {
  const source = `${explicit ?? ""} ${address}`;
  const match = source.toUpperCase().match(POSTCODE);
  if (!match || !match[1] || !match[2]) return { postcode: "", area: "" };
  return { postcode: `${match[1]} ${match[2]}`, area: match[1] };
}
function addressLines(raw, postcode) {
  const without = postcode ? raw.replace(new RegExp(postcode.replace(" ", "\\s*"), "i"), "").replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim() : raw.trim();
  const parts = without.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    line1: parts[0] ?? without,
    line2: parts[1] ?? "",
    line3: parts[2] ?? "",
    line4: parts[3] ?? ""
  };
}
function formatPublicationDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return iso.trim();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(match[2]) - 1];
  if (!month) return iso.trim();
  return `${Number(match[3])} ${month} ${match[1]}`;
}
function applicationReference(record) {
  const uid2 = blank(record.uid);
  if (uid2) return uid2;
  const reference = blank(record.reference);
  if (reference) return reference;
  const name = blank(record.name);
  const slash = name.indexOf("/");
  return slash >= 0 ? name.slice(slash + 1) : name;
}

// ../../packages/ingest/src/planit.ts
var PLANIT_USER_AGENT = "PlanningPal/0.1 (Hitcaliber Ltd; planning-data ingestion; mailto:alerts@aecpipeline.co.uk; +https://aecpipeline.co.uk)";
var ENDPOINT = "https://www.planit.org.uk/api/applics/json";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var sharedLastRequestAt = 0;
function parseRetryAfterMs(header, fallbackMs, maxWaitMs = 65e3, nowMs = Date.now()) {
  if (!header) return Math.min(fallbackMs, maxWaitMs);
  const trimmed = header.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.max(1e3, Math.round(seconds * 1e3)), maxWaitMs);
  }
  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    const delta = dateMs - nowMs;
    return Math.min(Math.max(1e3, delta), maxWaitMs);
  }
  return Math.min(fallbackMs, maxWaitMs);
}
function planItUrl(query, index2) {
  const params = new URLSearchParams();
  params.set("pg_sz", String(query.pageSize ?? 300));
  params.set("index", String(index2));
  params.set("compress", "on");
  if (query.from) params.set("start_date", query.from);
  if (query.to) params.set("end_date", query.to);
  if (!query.from && !query.to && query.recentDays) params.set("recent", String(query.recentDays));
  if (query.authority) params.set("auth", query.authority);
  return `${ENDPOINT}?${params.toString()}`;
}
async function getJson(url, fetchImpl, maxRetryWaitMs) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: "application/json", "User-Agent": PLANIT_USER_AGENT }
      });
      if (response.status === 429) {
        const retryAfter = response.headers?.get?.("retry-after") ?? null;
        const waitMs = parseRetryAfterMs(retryAfter, 15e3 * 2 ** attempt, maxRetryWaitMs);
        const err = new Error(`PlanIt responded 429${retryAfter ? ` (Retry-After: ${retryAfter}s)` : ""}`);
        err.retryAfterMs = waitMs;
        err.status = 429;
        throw err;
      }
      if (response.status >= 500) {
        throw new Error(`PlanIt responded ${response.status}`);
      }
      if (!response.ok) throw new Error(`PlanIt responded ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      const customWait = error instanceof Error && "retryAfterMs" in error && typeof error.retryAfterMs === "number" ? error.retryAfterMs : Math.min(1e3 * 2 ** attempt, maxRetryWaitMs);
      await sleep(customWait);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("PlanIt request failed");
}
function createPlanItSource(options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const envInterval = process.env.PLANIT_MIN_INTERVAL_MS ? Number(process.env.PLANIT_MIN_INTERVAL_MS) : void 0;
  const interval2 = options.minIntervalMs ?? (Number.isFinite(envInterval) ? envInterval : 2e3);
  const maxRetryWaitMs = options.maxRetryWaitMs ?? 3e4;
  const now = options.now ?? Date.now;
  return {
    id: "planit",
    async *fetchPages(query) {
      const pageSize = query.pageSize ?? 300;
      const maxPages = query.maxPages ?? 40;
      let index2 = 0;
      let total = null;
      for (let page = 0; page < maxPages; page += 1) {
        const wait = interval2 - (now() - sharedLastRequestAt);
        if (sharedLastRequestAt && wait > 0) await sleep(wait);
        const url = planItUrl(query, index2);
        sharedLastRequestAt = now();
        const body = await getJson(url, fetchImpl, maxRetryWaitMs);
        const records = Array.isArray(body.records) ? body.records : [];
        total = typeof body.total === "number" ? body.total : total;
        const raw = { url, body, records, total, from: typeof body.from === "number" ? body.from : index2 };
        yield raw;
        if (records.length === 0) return;
        index2 += records.length;
        if (total !== null && index2 >= total) return;
        if (records.length < pageSize) return;
      }
    }
  };
}

// ../../packages/ingest/src/filter.ts
var DEFAULT_FILTER = {
  dropTypes: ["Trees", "Conditions", "Advertising", "Telecoms", "Amendment"],
  patterns: [
    { reason: "tree works", source: String.raw`\b(tpo|tca)\b|works to trees|tree works|crown (reduce|lift|thin)|re-?pollard|\bpollard\b|fell(?:ing)? \d+ tree` },
    { reason: "discharge of conditions", source: String.raw`discharge of conditions?` },
    { reason: "non-material amendment", source: String.raw`non-?material amendment|\bNMA\b|minor material amendment` },
    { reason: "lawful development certificate", source: String.raw`certificate of lawfulness|lawful development|\bLDC\b` },
    { reason: "advertisement", source: String.raw`advertisement consent|consent to display an advertisement|\badvert(isement)?s?\b` },
    { reason: "prior notification", source: String.raw`prior notification|prior approval` }
  ]
};
function rejectionReason(record, config = DEFAULT_FILTER) {
  const type = blank(record.app_type);
  if (config.dropTypes.some((item) => item.toLowerCase() === type.toLowerCase())) return `type ${type}`;
  const haystack = [record.description, record.name, record.other_fields?.application_type, record.app_type].map(blank).join(" \n ");
  for (const pattern of config.patterns) {
    if (new RegExp(pattern.source, "i").test(haystack)) return pattern.reason;
  }
  return null;
}

// ../../packages/ingest/src/gazetteer.ts
var AUTHORITIES = {
  "aberdeen": { name: "Aberdeen", county: "Aberdeen", region: "Scotland" },
  "aberdeenshire": { name: "Aberdeenshire", county: "Aberdeenshire", region: "Scotland" },
  "allerdale": { name: "Allerdale", county: "Cumbria", region: "North West" },
  "amber valley": { name: "Amber Valley", county: "Derbyshire", region: "East Midlands" },
  "ards and north down": { name: "Ards and North Down", county: "Down", region: "Northern Ireland" },
  "ashfield": { name: "Ashfield", county: "Nottinghamshire", region: "East Midlands" },
  "babergh mid suffolk": { name: "Babergh and Mid Suffolk", county: "Suffolk", region: "East of England" },
  "barnet": { name: "Barnet", county: "London", region: "London" },
  "basildon": { name: "Basildon", county: "Essex", region: "East of England" },
  "basingstoke": { name: "Basingstoke and Deane", county: "Hampshire", region: "South East" },
  "bcp": { name: "Bournemouth, Christchurch and Poole", county: "Dorset", region: "South West" },
  "belfast": { name: "Belfast", county: "Antrim", region: "Northern Ireland" },
  "bexley": { name: "Bexley", county: "London", region: "London" },
  "bracknell": { name: "Bracknell Forest", county: "Berkshire", region: "South East" },
  "brentwood": { name: "Brentwood", county: "Essex", region: "East of England" },
  "bromley": { name: "Bromley", county: "London", region: "London" },
  "broxbourne": { name: "Broxbourne", county: "Hertfordshire", region: "East of England" },
  "buckinghamshire": { name: "Buckinghamshire", county: "Buckinghamshire", region: "South East" },
  "cairngorms": { name: "Cairngorms", county: "", region: "Scotland" },
  "cambridge": { name: "Cambridge", county: "Cambridgeshire", region: "East of England" },
  "camden": { name: "Camden", county: "London", region: "London" },
  "canterbury": { name: "Canterbury", county: "Kent", region: "South East" },
  "cardiff": { name: "Cardiff", county: "Cardiff", region: "Wales" },
  "chelmsford": { name: "Chelmsford", county: "Essex", region: "East of England" },
  "cheltenham": { name: "Cheltenham", county: "Gloucestershire", region: "South West" },
  "cherwell": { name: "Cherwell", county: "Oxfordshire", region: "South East" },
  "chester": { name: "Cheshire West and Chester", county: "Cheshire", region: "North West" },
  "city": { name: "City of London", county: "London", region: "London" },
  "copeland": { name: "Copeland", county: "Cumbria", region: "North West" },
  "cornwall": { name: "Cornwall", county: "Cornwall", region: "South West" },
  "cotswold": { name: "Cotswold", county: "Gloucestershire", region: "South West" },
  "crawley": { name: "Crawley", county: "West Sussex", region: "South East" },
  "croydon": { name: "Croydon", county: "London", region: "London" },
  "cumbria": { name: "Cumbria", county: "Cumbria", region: "North West" },
  "dacorum": { name: "Dacorum", county: "Hertfordshire", region: "East of England" },
  "dartford": { name: "Dartford", county: "Kent", region: "South East" },
  "derby": { name: "Derby", county: "Derbyshire", region: "East Midlands" },
  "doncaster": { name: "Doncaster", county: "South Yorkshire", region: "Yorkshire and the Humber" },
  "dorset": { name: "Dorset", county: "Dorset", region: "South West" },
  "dover": { name: "Dover", county: "Kent", region: "South East" },
  "dudley": { name: "Dudley", county: "West Midlands", region: "West Midlands" },
  "dumfries": { name: "Dumfries and Galloway", county: "Dumfries and Galloway", region: "Scotland" },
  "dundee": { name: "Dundee", county: "Dundee", region: "Scotland" },
  "east devon": { name: "East Devon", county: "Devon", region: "South West" },
  "east lothian": { name: "East Lothian", county: "East Lothian", region: "Scotland" },
  "east renfrewshire": { name: "East Renfrewshire", county: "East Renfrewshire", region: "Scotland" },
  "east suffolk": { name: "East Suffolk", county: "Suffolk", region: "East of England" },
  "epping forest": { name: "Epping Forest", county: "Essex", region: "East of England" },
  "epsom and ewell": { name: "Epsom and Ewell", county: "Surrey", region: "South East" },
  "exmoor": { name: "Exmoor", county: "", region: "South West" },
  "fermanagh and omagh": { name: "Fermanagh and Omagh", county: "Fermanagh and Omagh", region: "Northern Ireland" },
  "flintshire": { name: "Flintshire", county: "Flintshire", region: "Wales" },
  "fylde": { name: "Fylde", county: "Lancashire", region: "North West" },
  "gloucester": { name: "Gloucester", county: "Gloucestershire", region: "South West" },
  "gravesham": { name: "Gravesham", county: "Kent", region: "South East" },
  "greenwich": { name: "Greenwich", county: "London", region: "London" },
  "guildford": { name: "Guildford", county: "Surrey", region: "South East" },
  "haringey": { name: "Haringey", county: "London", region: "London" },
  "harlow": { name: "Harlow", county: "Essex", region: "East of England" },
  "hart": { name: "Hart", county: "Hampshire", region: "South East" },
  "hartlepool": { name: "Hartlepool", county: "Hartlepool", region: "North East" },
  "havant": { name: "Havant", county: "Hampshire", region: "South East" },
  "havering": { name: "Havering", county: "London", region: "London" },
  "hertsmere": { name: "Hertsmere", county: "Hertfordshire", region: "East of England" },
  "high peak": { name: "High Peak", county: "Derbyshire", region: "East Midlands" },
  "hull": { name: "Kingston upon Hull", county: "East Riding of Yorkshire", region: "Yorkshire and the Humber" },
  "huntingdonshire": { name: "Huntingdonshire", county: "Cambridgeshire", region: "East of England" },
  "hyndburn": { name: "Hyndburn", county: "Lancashire", region: "North West" },
  "isle of wight": { name: "Isle of Wight", county: "Isle of Wight", region: "South East" },
  "kirklees": { name: "Kirklees", county: "West Yorkshire", region: "Yorkshire and the Humber" },
  "leeds": { name: "Leeds", county: "West Yorkshire", region: "Yorkshire and the Humber" },
  "malvern hills": { name: "Malvern Hills", county: "Worcestershire", region: "West Midlands" },
  "manchester": { name: "Manchester", county: "Greater Manchester", region: "North West" },
  "medway": { name: "Medway", county: "Kent", region: "South East" },
  "merthyr tydfil": { name: "Merthyr Tydfil", county: "Merthyr Tydfil", region: "Wales" },
  "mid devon": { name: "Mid Devon", county: "Devon", region: "South West" },
  "mid east antrim": { name: "Mid and East Antrim", county: "Antrim", region: "Northern Ireland" },
  "mid ulster": { name: "Mid Ulster", county: "Mid Ulster", region: "Northern Ireland" },
  "midlothian": { name: "Midlothian", county: "Midlothian", region: "Scotland" },
  "newham": { name: "Newham", county: "London", region: "London" },
  "newry mourne down": { name: "Newry, Mourne and Down", county: "Down", region: "Northern Ireland" },
  "norfolk": { name: "Norfolk", county: "Norfolk", region: "East of England" },
  "north ayrshire": { name: "North Ayrshire", county: "North Ayrshire", region: "Scotland" },
  "north east lincs": { name: "North East Lincolnshire", county: "Lincolnshire", region: "Yorkshire and the Humber" },
  "north kesteven": { name: "North Kesteven", county: "Lincolnshire", region: "East Midlands" },
  "north tyneside": { name: "North Tyneside", county: "Tyne and Wear", region: "North East" },
  "northumberland": { name: "Northumberland", county: "Northumberland", region: "North East" },
  "northumberland (county)": { name: "Northumberland", county: "Northumberland", region: "North East" },
  "oxford": { name: "Oxford", county: "Oxfordshire", region: "South East" },
  "peak district": { name: "Peak District", county: "", region: "" },
  "pendle": { name: "Pendle", county: "Lancashire", region: "North West" },
  "perth": { name: "Perth and Kinross", county: "Perth and Kinross", region: "Scotland" },
  "powys": { name: "Powys", county: "Powys", region: "Wales" },
  "reading": { name: "Reading", county: "Berkshire", region: "South East" },
  "redbridge": { name: "Redbridge", county: "London", region: "London" },
  "redcar and cleveland": { name: "Redcar and Cleveland", county: "North Yorkshire", region: "North East" },
  "reigate": { name: "Reigate and Banstead", county: "Surrey", region: "South East" },
  "richmond": { name: "Richmond upon Thames", county: "London", region: "London" },
  "rotherham": { name: "Rotherham", county: "South Yorkshire", region: "Yorkshire and the Humber" },
  "runnymede": { name: "Runnymede", county: "Surrey", region: "South East" },
  "salford": { name: "Salford", county: "Greater Manchester", region: "North West" },
  "scilly isles": { name: "Isles of Scilly", county: "Isles of Scilly", region: "South West" },
  "scottish borders": { name: "Scottish Borders", county: "Scottish Borders", region: "Scotland" },
  "sedgemoor": { name: "Sedgemoor", county: "Somerset", region: "South West" },
  "sevenoaks": { name: "Sevenoaks", county: "Kent", region: "South East" },
  "slough": { name: "Slough", county: "Berkshire", region: "South East" },
  "somerset": { name: "Somerset", county: "Somerset", region: "South West" },
  "south ayrshire": { name: "South Ayrshire", county: "South Ayrshire", region: "Scotland" },
  "south cambridgeshire": { name: "South Cambridgeshire", county: "Cambridgeshire", region: "East of England" },
  "south downs": { name: "South Downs", county: "", region: "South East" },
  "south gloucestershire": { name: "South Gloucestershire", county: "Gloucestershire", region: "South West" },
  "south norfolk broadland": { name: "South Norfolk and Broadland", county: "Norfolk", region: "East of England" },
  "south ribble": { name: "South Ribble", county: "Lancashire", region: "North West" },
  "south somerset": { name: "South Somerset", county: "Somerset", region: "South West" },
  "south west devon": { name: "South West Devon", county: "Devon", region: "South West" },
  "southwark": { name: "Southwark", county: "London", region: "London" },
  "spelthorne": { name: "Spelthorne", county: "Surrey", region: "South East" },
  "staffordshire moorlands": { name: "Staffordshire Moorlands", county: "Staffordshire", region: "West Midlands" },
  "stockport": { name: "Stockport", county: "Greater Manchester", region: "North West" },
  "stroud": { name: "Stroud", county: "Gloucestershire", region: "South West" },
  "surrey heath": { name: "Surrey Heath", county: "Surrey", region: "South East" },
  "swansea": { name: "Swansea", county: "Swansea", region: "Wales" },
  "swindon": { name: "Swindon", county: "Wiltshire", region: "South West" },
  "tamworth": { name: "Tamworth", county: "Staffordshire", region: "West Midlands" },
  "tandridge": { name: "Tandridge", county: "Surrey", region: "South East" },
  "teignbridge": { name: "Teignbridge", county: "Devon", region: "South West" },
  "test valley": { name: "Test Valley", county: "Hampshire", region: "South East" },
  "three rivers": { name: "Three Rivers", county: "Hertfordshire", region: "East of England" },
  "tonbridge": { name: "Tonbridge and Malling", county: "Kent", region: "South East" },
  "torbay": { name: "Torbay", county: "Devon", region: "South West" },
  "tower hamlets": { name: "Tower Hamlets", county: "London", region: "London" },
  "trafford": { name: "Trafford", county: "Greater Manchester", region: "North West" },
  "uttlesford": { name: "Uttlesford", county: "Essex", region: "East of England" },
  "walsall": { name: "Walsall", county: "West Midlands", region: "West Midlands" },
  "waverley": { name: "Waverley", county: "Surrey", region: "South East" },
  "wealden": { name: "Wealden", county: "East Sussex", region: "South East" },
  "west berkshire": { name: "West Berkshire", county: "Berkshire", region: "South East" },
  "west lancashire": { name: "West Lancashire", county: "Lancashire", region: "North West" },
  "west oxfordshire": { name: "West Oxfordshire", county: "Oxfordshire", region: "South East" },
  "western isles": { name: "Na h-Eileanan Siar", county: "Na h-Eileanan Siar", region: "Scotland" },
  "wiltshire": { name: "Wiltshire", county: "Wiltshire", region: "South West" },
  "winchester": { name: "Winchester", county: "Hampshire", region: "South East" },
  "woking": { name: "Woking", county: "Surrey", region: "South East" },
  "wokingham": { name: "Wokingham", county: "Berkshire", region: "South East" },
  "wolverhampton": { name: "Wolverhampton", county: "West Midlands", region: "West Midlands" },
  "worcester": { name: "Worcester", county: "Worcestershire", region: "West Midlands" },
  "wychavon": { name: "Wychavon", county: "Worcestershire", region: "West Midlands" },
  "wyre": { name: "Wyre", county: "Lancashire", region: "North West" },
  "york": { name: "York", county: "North Yorkshire", region: "Yorkshire and the Humber" }
};
function lookupAuthority(areaName) {
  const key = areaName.trim().toLowerCase().replace(/\s+/g, " ");
  return AUTHORITIES[key] ?? { name: areaName.trim(), county: "", region: "" };
}

// ../../packages/ingest/src/londonDatahub.ts
var LONDON_DATAHUB_ENDPOINT = "https://planningdata.london.gov.uk/api-guest/applications/_search";
var LONDON_ALLOW_HEADER = "be2rmRnt&";
function parseUkDateToIso(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash?.[1] && slash[2] && slash[3]) {
    const year = Number(slash[3]);
    if (year < 2e3 || year > 2100) return null;
    return `${slash[3]}-${slash[2]}-${slash[1]}`;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso?.[1] && iso[2] && iso[3]) {
    const year = Number(iso[1]);
    if (year < 2e3 || year > 2100) return null;
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  return null;
}
function buildAddress(source) {
  const parts = [
    source.site_name ? String(source.site_name).trim() : "",
    [source.site_number ? String(source.site_number).trim() : "", source.street_name ? String(source.street_name).trim() : ""].filter(Boolean).join(" "),
    source.locality ? String(source.locality).trim() : "London",
    source.postcode ? String(source.postcode).trim() : ""
  ].filter(Boolean);
  const deduped = [];
  for (const part of parts) {
    if (!deduped.some((existing) => existing.toLowerCase().includes(part.toLowerCase()))) {
      deduped.push(part);
    }
  }
  return deduped.join(", ");
}
function mapLondonDatahubHit(source) {
  const area = (source.lpa_name || source.borough || "").replace(/^London Borough of\s+/i, "").trim();
  const uid2 = (source.lpa_app_no || "").trim();
  if (!area || !uid2) return null;
  const details = source.application_details && typeof source.application_details === "object" ? source.application_details : {};
  const applicant = String(
    details.lead_developer_company_name ?? details.applicant_company ?? details.applicant_name ?? ""
  ).trim();
  const agentCompany = String(details.agent_company ?? details.agent_company_name ?? "").trim();
  const agentName = String(details.agent_name ?? "").trim();
  const agentAddress = String(details.agent_address ?? "").trim();
  const startDate = parseUkDateToIso(source.valid_date) ?? (source.last_updated ? source.last_updated.slice(0, 10) : null);
  const decidedDate = parseUkDateToIso(source.decision_date);
  const state = (source.decision || source.status || "Undecided").trim();
  const fullType = (source.application_type_full || source.application_type || "Full").trim();
  const lat = typeof source.centroid?.lat === "number" ? source.centroid.lat : null;
  const lon = typeof source.centroid?.lon === "number" ? source.centroid.lon : null;
  return {
    name: `${area}/${uid2}`,
    uid: uid2,
    reference: uid2,
    area_name: area,
    address: buildAddress(source),
    postcode: source.postcode ? String(source.postcode).trim() : null,
    description: source.description ?? "",
    app_type: fullType,
    app_size: String(details.development_scale ?? "Medium"),
    app_state: state,
    start_date: startDate,
    decided_date: decidedDate,
    url: source.url_planning_app ?? null,
    link: source.url_planning_app ?? null,
    last_different: source.last_updated ?? source.last_synced ?? null,
    last_changed: source.last_updated ?? null,
    location_x: lon,
    location_y: lat,
    other_fields: {
      application_type: fullType,
      date_validated: startDate ?? "",
      applicant_name: applicant,
      agent_name: agentName,
      agent_company: agentCompany,
      agent_address: agentAddress
    }
  };
}
function buildLondonDatahubBody(query, fromIndex) {
  const size2 = Math.min(query.pageSize ?? 200, 500);
  const must = [];
  if (query.authority) {
    must.push({
      multi_match: {
        query: query.authority,
        fields: ["lpa_name", "borough"]
      }
    });
  }
  const now = Date.now();
  const sinceIso = query.from ? `${query.from}T00:00:00Z` : query.recentDays ? new Date(now - query.recentDays * 864e5).toISOString() : new Date(now - 7 * 864e5).toISOString();
  const range = { gte: sinceIso };
  if (query.to) range.lte = `${query.to}T23:59:59Z`;
  must.push({ range: { last_updated: range } });
  return {
    from: fromIndex,
    size: size2,
    sort: [{ last_updated: { order: "desc" } }],
    query: { bool: { must } }
  };
}
function createLondonDatahubSource(options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    id: "london-datahub",
    async *fetchPages(query) {
      const pageSize = Math.min(query.pageSize ?? 200, 500);
      const maxPages = query.maxPages ?? 15;
      let index2 = 0;
      for (let page = 0; page < maxPages; page += 1) {
        const payload = buildLondonDatahubBody(query, index2);
        const response = await fetchImpl(LONDON_DATAHUB_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": PLANIT_USER_AGENT,
            "X-API-AllowRequest": LONDON_ALLOW_HEADER
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`London Datahub responded ${response.status}`);
        }
        const json2 = await response.json();
        const rawHits = json2.hits?.hits ?? [];
        const total = typeof json2.hits?.total === "number" ? json2.hits.total : typeof json2.hits?.total?.value === "number" ? json2.hits.total.value : null;
        const records = rawHits.map((hit) => hit._source ? mapLondonDatahubHit(hit._source) : null).filter((item) => item !== null);
        const raw = {
          url: `${LONDON_DATAHUB_ENDPOINT}?from=${index2}&size=${pageSize}`,
          body: json2,
          records,
          total,
          from: index2
        };
        yield raw;
        if (rawHits.length === 0) return;
        index2 += rawHits.length;
        if (total !== null && index2 >= total) return;
        if (rawHits.length < pageSize) return;
      }
    }
  };
}
function createHybridPlanningSource(options = {}) {
  const planit = createPlanItSource(options);
  const london = createLondonDatahubSource({ fetchImpl: options.fetchImpl });
  return {
    id: "auto",
    async *fetchPages(query) {
      if (query.source === "london-datahub") {
        yield* london.fetchPages(query);
        return;
      }
      if (query.source === "planit") {
        yield* planit.fetchPages(query);
        return;
      }
      try {
        yield* planit.fetchPages(query);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (/429|rate|5\d\d|fetch/i.test(message)) {
          yield* london.fetchPages(query);
          return;
        }
        throw error;
      }
    }
  };
}

// ../../packages/shared/src/data/uk-lpa-master.json
var uk_lpa_master_default = [
  {
    name: "Adur District Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000223",
    lpa_gss_code: "E60000281",
    pdgov_organisation: "local-authority:ADU",
    pdgov_org_entity: "26",
    pdgov_lpa_entity: "626281",
    planit_area_name: "Adur",
    planit_area_id: 245,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.adur-worthing.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.adur-worthing.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Adur and Worthing' (id 449, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Amber Valley Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000032",
    lpa_gss_code: "E60000077",
    pdgov_organisation: "local-authority:AMB",
    pdgov_org_entity: "28",
    pdgov_lpa_entity: "626077",
    planit_area_name: "Amber Valley",
    planit_area_id: 72,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 37720,
    planning_portal_url: "https://www.ambervalley.gov.uk/planning/development-management/view-a-planning-application/",
    website: "https://www.ambervalley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Arun District Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000224",
    lpa_gss_code: "E60000282",
    pdgov_organisation: "local-authority:ARU",
    pdgov_org_entity: "29",
    pdgov_lpa_entity: "626282",
    planit_area_name: "Arun",
    planit_area_id: 246,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-24",
    planit_total_apps: 53601,
    planning_portal_url: "https://www1.arun.gov.uk/aplanning/OcellaWeb/planningSearch",
    website: "https://www.arun.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ashfield District Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000170",
    lpa_gss_code: "E60000106",
    pdgov_organisation: "local-authority:ASH",
    pdgov_org_entity: "31",
    pdgov_lpa_entity: "626106",
    planit_area_name: "Ashfield",
    planit_area_id: 197,
    planit_covered: "yes",
    planit_scraper_type: "CivicaJson",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 24462,
    planning_portal_url: "https://planning.ashfield.gov.uk/planning-applications/search-applications/",
    website: "https://www.ashfield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ashford Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000105",
    lpa_gss_code: "E60000253",
    pdgov_organisation: "local-authority:ASF",
    pdgov_org_entity: "30",
    pdgov_lpa_entity: "626253",
    planit_area_name: "Ashford",
    planit_area_id: 138,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 59935,
    planning_portal_url: "https://ashfordboroughcouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.ashford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Babergh District Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000200",
    lpa_gss_code: "E60000183",
    pdgov_organisation: "local-authority:BAB",
    pdgov_org_entity: "33",
    pdgov_lpa_entity: "626183",
    planit_area_name: "Babergh",
    planit_area_id: 222,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.baberghmidsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.babergh.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Babergh Mid Suffolk' (id 511, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Barnsley Metropolitan Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000016",
    lpa_gss_code: "E60000064",
    pdgov_organisation: "local-authority:BNS",
    pdgov_org_entity: "50",
    pdgov_lpa_entity: "626064",
    planit_area_name: "Barnsley",
    planit_area_id: 273,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 35151,
    planning_portal_url: "https://planningexplorer.barnsley.gov.uk/Home/AdvanceSearch",
    website: "https://www.barnsley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Basildon Borough Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000066",
    lpa_gss_code: "E60000154",
    pdgov_organisation: "local-authority:BAI",
    pdgov_org_entity: "35",
    pdgov_lpa_entity: "626154",
    planit_area_name: "Basildon",
    planit_area_id: 99,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 29526,
    planning_portal_url: "https://planning.basildon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.basildon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Basingstoke and Deane Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000084",
    lpa_gss_code: "E60000242",
    pdgov_organisation: "local-authority:BAN",
    pdgov_org_entity: "36",
    pdgov_lpa_entity: "626242",
    planit_area_name: "Basingstoke",
    planit_area_id: 117,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 62336,
    planning_portal_url: "https://planning.basingstoke.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.basingstoke.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bassetlaw District Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000171",
    lpa_gss_code: "E60000107",
    pdgov_organisation: "local-authority:BAE",
    pdgov_org_entity: "34",
    pdgov_lpa_entity: "626107",
    planit_area_name: "Bassetlaw",
    planit_area_id: 198,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 31510,
    planning_portal_url: "https://publicaccess.bassetlaw.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bassetlaw.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bath and North East Somerset Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000022",
    lpa_gss_code: "E60000288",
    pdgov_organisation: "local-authority:BAS",
    pdgov_org_entity: "38",
    pdgov_lpa_entity: "626288",
    planit_area_name: "Bath",
    planit_area_id: 22,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-01",
    planit_total_apps: 97655,
    planning_portal_url: "https://www.bathnes.gov.uk/webforms/planning/search.html#advancedSearch",
    website: "https://www.bathnes.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bedford Borough Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000055",
    lpa_gss_code: "E60000143",
    pdgov_organisation: "local-authority:BDF",
    pdgov_org_entity: "40",
    pdgov_lpa_entity: "626143",
    planit_area_name: "Bedford",
    planit_area_id: 55,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-08",
    planit_total_apps: 69482,
    planning_portal_url: "https://publicaccess.bedford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bedford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Birmingham City Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000025",
    lpa_gss_code: "E60000130",
    pdgov_organisation: "local-authority:BIR",
    pdgov_org_entity: "44",
    pdgov_lpa_entity: "626130",
    planit_area_name: "Birmingham",
    planit_area_id: 282,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 191571,
    planning_portal_url: "https://planning.birmingham.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.birmingham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Blaby District Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000129",
    lpa_gss_code: "E60000085",
    pdgov_organisation: "local-authority:BLA",
    pdgov_org_entity: "46",
    pdgov_lpa_entity: "626085",
    planit_area_name: "Blaby",
    planit_area_id: 162,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 25398,
    planning_portal_url: "https://pa.blaby.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.blaby.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Blackburn with Darwen Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000008",
    lpa_gss_code: "E60000013",
    pdgov_organisation: "local-authority:BBD",
    pdgov_org_entity: "39",
    pdgov_lpa_entity: "626013",
    planit_area_name: "Blackburn",
    planit_area_id: 8,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-06-08",
    planit_total_apps: 32072,
    planning_portal_url: "https://planning.blackburn.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx",
    website: "https://www.blackburn.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-06-08)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Blackpool Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000009",
    lpa_gss_code: "E60000014",
    pdgov_organisation: "local-authority:BPL",
    pdgov_org_entity: "55",
    pdgov_lpa_entity: "626014",
    planit_area_name: "Blackpool",
    planit_area_id: 9,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-22",
    planit_total_apps: 18160,
    planning_portal_url: "https://idoxpa.blackpool.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.blackpool.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bolsover District Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000033",
    lpa_gss_code: "E60000078",
    pdgov_organisation: "local-authority:BOS",
    pdgov_org_entity: "52",
    pdgov_lpa_entity: "626078",
    planit_area_name: "Bolsover",
    planit_area_id: 73,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-01",
    planit_total_apps: 17143,
    planning_portal_url: "https://publicaccess.bolsover.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bolsover.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bolton Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000001",
    lpa_gss_code: "E60000025",
    pdgov_organisation: "local-authority:BOL",
    pdgov_org_entity: "51",
    pdgov_lpa_entity: "626025",
    planit_area_name: "Bolton",
    planit_area_id: 258,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 61504,
    planning_portal_url: "https://paplanning.bolton.gov.uk/online-applications/search.do?action=advanced&searchType=Application",
    website: "https://www.bolton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Borough Council of King's Lynn and West Norfolk",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000146",
    lpa_gss_code: "E60000179",
    pdgov_organisation: "local-authority:KIN",
    pdgov_org_entity: "186",
    pdgov_lpa_entity: "626179",
    planit_area_name: "Kings Lynn",
    planit_area_id: 179,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 67231,
    planning_portal_url: "https://online.west-norfolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.west-norfolk.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Boston Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000136",
    lpa_gss_code: "E60000092",
    pdgov_organisation: "local-authority:BOT",
    pdgov_org_entity: "53",
    pdgov_lpa_entity: "626092",
    planit_area_name: "Boston",
    planit_area_id: 169,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-09-28",
    planit_total_apps: 17704,
    planning_portal_url: "https://www.boston.gov.uk/planningapplicationsearch",
    website: "https://www.boston.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bournemouth, Christchurch and Poole Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000058",
    lpa_gss_code: "E60000289",
    pdgov_organisation: "local-authority:BPC",
    pdgov_org_entity: "54",
    pdgov_lpa_entity: "626289",
    planit_area_name: "BCP",
    planit_area_id: 516,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 151828,
    planning_portal_url: "https://planning.bcpcouncil.gov.uk/Search/Advanced/",
    website: "https://www.bcpcouncil.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bracknell Forest Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000036",
    lpa_gss_code: "E60000221",
    pdgov_organisation: "local-authority:BRC",
    pdgov_org_entity: "57",
    pdgov_lpa_entity: "626221",
    planit_area_name: "Bracknell",
    planit_area_id: 36,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 33911,
    planning_portal_url: "https://publicaccess.bracknell-forest.gov.uk/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.bracknell-forest.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Braintree District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000067",
    lpa_gss_code: "E60000155",
    pdgov_organisation: "local-authority:BRA",
    pdgov_org_entity: "56",
    pdgov_lpa_entity: "626155",
    planit_area_name: "Braintree",
    planit_area_id: 100,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2023-11-29",
    planit_total_apps: 53960,
    planning_portal_url: "https://publicaccess.braintree.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.braintree.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2023-11-29)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Breckland District Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000143",
    lpa_gss_code: "E60000176",
    pdgov_organisation: "local-authority:BRE",
    pdgov_org_entity: "59",
    pdgov_lpa_entity: "626176",
    planit_area_name: "Breckland",
    planit_area_id: 176,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-06",
    planit_total_apps: 51940,
    planning_portal_url: "https://publicportal.breckland.gov.uk/planning/index.html?fa=search",
    website: "https://www.breckland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-06)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Brentwood Borough Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000068",
    lpa_gss_code: "E60000156",
    pdgov_organisation: "local-authority:BRW",
    pdgov_org_entity: "63",
    pdgov_lpa_entity: "626156",
    planit_area_name: "Brentwood",
    planit_area_id: 101,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 38237,
    planning_portal_url: "https://publicaccess.brentwood.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.brentwood.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Brighton and Hove City Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000043",
    lpa_gss_code: "E60000222",
    pdgov_organisation: "local-authority:BNH",
    pdgov_org_entity: "49",
    pdgov_lpa_entity: "626222",
    planit_area_name: "Brighton",
    planit_area_id: 43,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-02-27",
    planit_total_apps: 97926,
    planning_portal_url: "https://planningapps.brighton-hove.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.brighton-hove.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-02-27)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bristol City Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000023",
    lpa_gss_code: "E60000290",
    pdgov_organisation: "local-authority:BST",
    pdgov_org_entity: "66",
    pdgov_lpa_entity: "626290",
    planit_area_name: "Bristol",
    planit_area_id: 23,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-07",
    planit_total_apps: 134820,
    planning_portal_url: "https://pa.bristol.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bristol.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Broadland District Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000144",
    lpa_gss_code: "E60000177",
    pdgov_organisation: "local-authority:BRO",
    pdgov_org_entity: "61",
    pdgov_lpa_entity: "626177",
    planit_area_name: "Broadland",
    planit_area_id: 177,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.broadland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'South Norfolk Broadland' (id 521, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Broads Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000007",
    lpa_gss_code: "E60000326",
    pdgov_organisation: "national-park-authority:Q4972284",
    pdgov_org_entity: "399",
    pdgov_lpa_entity: "626326",
    planit_area_name: "Broads",
    planit_area_id: 360,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-14",
    planit_total_apps: 9457,
    planning_portal_url: "https://planning.broads-authority.gov.uk/online-applications/search.do?action=advanced",
    website: "http://www.broads-authority.gov.uk/broads-authority",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bromsgrove District Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000234",
    lpa_gss_code: "E60000137",
    pdgov_organisation: "local-authority:BRM",
    pdgov_org_entity: "60",
    pdgov_lpa_entity: "626137",
    planit_area_name: "Bromsgrove",
    planit_area_id: 252,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://publicaccess.bromsgroveandredditch.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bromsgrove.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Bromsgrove Redditch' (id 512, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Broxbourne Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000095",
    lpa_gss_code: "E60000166",
    pdgov_organisation: "local-authority:BRX",
    pdgov_org_entity: "64",
    pdgov_lpa_entity: "626166",
    planit_area_name: "Broxbourne",
    planit_area_id: 128,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 28904,
    planning_portal_url: "https://planning.broxbourne.gov.uk/LPAssure/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.broxbourne.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Broxtowe Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000172",
    lpa_gss_code: "E60000108",
    pdgov_organisation: "local-authority:BRT",
    pdgov_org_entity: "62",
    pdgov_lpa_entity: "626108",
    planit_area_name: "Broxtowe",
    planit_area_id: 199,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 24644,
    planning_portal_url: "https://publicaccess.broxtowe.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.broxtowe.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Buckinghamshire Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000060",
    lpa_gss_code: "E60000331",
    pdgov_organisation: "local-authority:BUC",
    pdgov_org_entity: "67",
    pdgov_lpa_entity: "626331",
    planit_area_name: "Buckinghamshire",
    planit_area_id: 327,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 272832,
    planning_portal_url: "https://publicaccess.buckinghamshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.buckinghamshire.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Burnley Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000117",
    lpa_gss_code: "E60000035",
    pdgov_organisation: "local-authority:BUN",
    pdgov_org_entity: "68",
    pdgov_lpa_entity: "626035",
    planit_area_name: "Burnley",
    planit_area_id: 150,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 16188,
    planning_portal_url: "https://burnleycouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.burnley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bury Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000002",
    lpa_gss_code: "E60000026",
    pdgov_organisation: "local-authority:BUR",
    pdgov_org_entity: "69",
    pdgov_lpa_entity: "626026",
    planit_area_name: "Bury",
    planit_area_id: 259,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 35403,
    planning_portal_url: "https://planning.bury.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bury.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Calderdale Metropolitan Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000033",
    lpa_gss_code: "E60000069",
    pdgov_organisation: "local-authority:CLD",
    pdgov_org_entity: "88",
    pdgov_lpa_entity: "626069",
    planit_area_name: "Calderdale",
    planit_area_id: 290,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 53379,
    planning_portal_url: "https://portal.calderdale.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.calderdale.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cambridge City Council",
    nation: "England",
    region: "East of England",
    county: "Cambridgeshire",
    type: "district",
    gss_code: "E07000008",
    lpa_gss_code: "E60000149",
    pdgov_organisation: "local-authority:CAB",
    pdgov_org_entity: "70",
    pdgov_lpa_entity: "626149",
    planit_area_name: "Cambridge",
    planit_area_id: 61,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 62907,
    planning_portal_url: "https://applications.greatercambridgeplanning.org/online-applications/search.do?action=advanced",
    website: "https://www.cambridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cannock Chase District Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000192",
    lpa_gss_code: "E60000117",
    pdgov_organisation: "local-authority:CAN",
    pdgov_org_entity: "72",
    pdgov_lpa_entity: "626117",
    planit_area_name: "Cannock Chase",
    planit_area_id: 214,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 15631,
    planning_portal_url: "https://planning.agileapplications.co.uk/cannock/search-applications/",
    website: "https://www.cannockchasedc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Canterbury City Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000106",
    lpa_gss_code: "E60000254",
    pdgov_organisation: "local-authority:CAT",
    pdgov_org_entity: "75",
    pdgov_lpa_entity: "626254",
    planit_area_name: "Canterbury",
    planit_area_id: 139,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 66170,
    planning_portal_url: "https://pa.canterbury.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.canterbury.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Castle Point Borough Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000069",
    lpa_gss_code: "E60000157",
    pdgov_organisation: "local-authority:CAS",
    pdgov_org_entity: "74",
    pdgov_lpa_entity: "626157",
    planit_area_name: "Castle Point",
    planit_area_id: 102,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 22028,
    planning_portal_url: "https://publicaccess.castlepoint.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.castlepoint.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Central Bedfordshire Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000056",
    lpa_gss_code: "E60000144",
    pdgov_organisation: "local-authority:CBF",
    pdgov_org_entity: "76",
    pdgov_lpa_entity: "626144",
    planit_area_name: "Central Bedfordshire",
    planit_area_id: 56,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 83716,
    planning_portal_url: "https://plantech.centralbedfordshire.gov.uk/PLANTECH/DCWebPages/acolnetcgi.gov?ACTION=UNWRAP&RIPNAME=Root.pgesearch",
    website: "https://www.centralbedfordshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Charnwood Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000130",
    lpa_gss_code: "E60000086",
    pdgov_organisation: "local-authority:CHA",
    pdgov_org_entity: "77",
    pdgov_lpa_entity: "626086",
    planit_area_name: "Charnwood",
    planit_area_id: 163,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-19",
    planit_total_apps: 66383,
    planning_portal_url: "https://planningexplorer.charnwood.gov.uk/Assure/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.charnwood.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Chelmsford City Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000070",
    lpa_gss_code: "E60000158",
    pdgov_organisation: "local-authority:CHL",
    pdgov_org_entity: "81",
    pdgov_lpa_entity: "626158",
    planit_area_name: "Chelmsford",
    planit_area_id: 103,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 73566,
    planning_portal_url: "https://publicaccess.chelmsford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.chelmsford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cheltenham Borough Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000078",
    lpa_gss_code: "E60000308",
    pdgov_organisation: "local-authority:CHT",
    pdgov_org_entity: "86",
    pdgov_lpa_entity: "626308",
    planit_area_name: "Cheltenham",
    planit_area_id: 111,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 46752,
    planning_portal_url: "https://publicaccess.cheltenham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cheltenham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cherwell District Council",
    nation: "England",
    region: "South East",
    county: "Oxfordshire",
    type: "district",
    gss_code: "E07000177",
    lpa_gss_code: "E60000265",
    pdgov_organisation: "local-authority:CHR",
    pdgov_org_entity: "84",
    pdgov_lpa_entity: "626265",
    planit_area_name: "Cherwell",
    planit_area_id: 204,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 76991,
    planning_portal_url: "https://planningregister.cherwell.gov.uk/Search/Advanced/",
    website: "https://www.cherwell-dc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cheshire East Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000049",
    lpa_gss_code: "E60000015",
    pdgov_organisation: "local-authority:CHE",
    pdgov_org_entity: "79",
    pdgov_lpa_entity: "626015",
    planit_area_name: "Cheshire East",
    planit_area_id: 49,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-06",
    planit_total_apps: 132365,
    planning_portal_url: "https://pa.cheshireeast.gov.uk/planning/index.html?fa=search",
    website: "https://www.cheshireeast.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-06)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cheshire West and Chester Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000050",
    lpa_gss_code: "E60000016",
    pdgov_organisation: "local-authority:CHW",
    pdgov_org_entity: "87",
    pdgov_lpa_entity: "626016",
    planit_area_name: "Chester",
    planit_area_id: 50,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 110405,
    planning_portal_url: "https://pa.cheshirewestandchester.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cheshirewestandchester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Chesterfield Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000034",
    lpa_gss_code: "E60000079",
    pdgov_organisation: "local-authority:CHS",
    pdgov_org_entity: "85",
    pdgov_lpa_entity: "626079",
    planit_area_name: "Chesterfield",
    planit_area_id: 74,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 21611,
    planning_portal_url: "https://publicaccess.chesterfield.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.chesterfield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Chichester District Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000225",
    lpa_gss_code: "E60000283",
    pdgov_organisation: "local-authority:CHI",
    pdgov_org_entity: "80",
    pdgov_lpa_entity: "626283",
    planit_area_name: "Chichester",
    planit_area_id: 247,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 65128,
    planning_portal_url: "https://publicaccess.chichester.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.chichester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Chorley Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000118",
    lpa_gss_code: "E60000036",
    pdgov_organisation: "local-authority:CHO",
    pdgov_org_entity: "83",
    pdgov_lpa_entity: "626036",
    planit_area_name: "Chorley",
    planit_area_id: 151,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 29349,
    planning_portal_url: "https://planning.chorley.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.chorley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of Bradford Metropolitan District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000032",
    lpa_gss_code: "E60000068",
    pdgov_organisation: "local-authority:BRD",
    pdgov_org_entity: "58",
    pdgov_lpa_entity: "626068",
    planit_area_name: "Bradford",
    planit_area_id: 289,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-14",
    planit_total_apps: 128622,
    planning_portal_url: "https://planning.bradford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bradford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of Lincoln Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000138",
    lpa_gss_code: "E60000094",
    pdgov_organisation: "local-authority:LIC",
    pdgov_org_entity: "199",
    pdgov_lpa_entity: "626094",
    planit_area_name: "Lincoln",
    planit_area_id: 171,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 22729,
    planning_portal_url: "https://planning.lincoln.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lincoln.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of London Corporation",
    nation: "England",
    region: "London",
    county: "",
    type: "city of london",
    gss_code: "E09000001",
    lpa_gss_code: "E60000189",
    pdgov_organisation: "local-authority:LND",
    pdgov_org_entity: "203",
    pdgov_lpa_entity: "626189",
    planit_area_name: "City",
    planit_area_id: 294,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 28715,
    planning_portal_url: "https://www.planning2.cityoflondon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cityoflondon.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of Westminster",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000033",
    lpa_gss_code: "E60000201",
    pdgov_organisation: "local-authority:WSM",
    pdgov_org_entity: "387",
    pdgov_lpa_entity: "626201",
    planit_area_name: "Westminster",
    planit_area_id: 326,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 235240,
    planning_portal_url: "https://idoxpa.westminster.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westminster.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of Wolverhampton Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000031",
    lpa_gss_code: "E60000136",
    pdgov_organisation: "local-authority:WLV",
    pdgov_org_entity: "374",
    pdgov_lpa_entity: "626136",
    planit_area_name: "Wolverhampton",
    planit_area_id: 288,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 35684,
    planning_portal_url: "https://planningonline.wolverhampton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.wolverhampton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City of York Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000014",
    lpa_gss_code: "E60000056",
    pdgov_organisation: "local-authority:YOR",
    pdgov_org_entity: "395",
    pdgov_lpa_entity: "626056",
    planit_area_name: "York",
    planit_area_id: 14,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 64425,
    planning_portal_url: "https://planningaccess.york.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.york.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Colchester City Council",
    nation: "England",
    region: "",
    county: "Essex",
    type: "district",
    gss_code: "E07000071",
    lpa_gss_code: "E60000159",
    pdgov_organisation: "local-authority:COL",
    pdgov_org_entity: "91",
    pdgov_lpa_entity: "626159",
    planit_area_name: "Colchester",
    planit_area_id: 104,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 53613,
    planning_portal_url: "https://www.colchester.gov.uk/planning-search/",
    website: "https://www.colchester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cornwall Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000052",
    lpa_gss_code: "E60000291",
    pdgov_organisation: "local-authority:CON",
    pdgov_org_entity: "92",
    pdgov_lpa_entity: "626291",
    planit_area_name: "Cornwall",
    planit_area_id: 52,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 316669,
    planning_portal_url: "https://planning.cornwall.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cornwall.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cotswold District Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000079",
    lpa_gss_code: "E60000309",
    pdgov_organisation: "local-authority:COT",
    pdgov_org_entity: "95",
    pdgov_lpa_entity: "626309",
    planit_area_name: "Cotswold",
    planit_area_id: 112,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 76102,
    planning_portal_url: "https://publicaccess.cotswold.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cotswold.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Council of the Isles of Scilly",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000053",
    lpa_gss_code: "E60000293",
    pdgov_organisation: "local-authority:IOS",
    pdgov_org_entity: "178",
    pdgov_lpa_entity: "626293",
    planit_area_name: "Scilly Isles",
    planit_area_id: 53,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 1955,
    planning_portal_url: "https://www.scilly.gov.uk/planning-development/planning-applications",
    website: "https://www.scilly.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Coventry City Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000026",
    lpa_gss_code: "E60000131",
    pdgov_organisation: "local-authority:COV",
    pdgov_org_entity: "96",
    pdgov_lpa_entity: "626131",
    planit_area_name: "Coventry",
    planit_area_id: 283,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-07",
    planit_total_apps: 67438,
    planning_portal_url: "https://planandregulatory.coventry.gov.uk/planning/index.html?fa=search",
    website: "https://www.coventry.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-07)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Crawley Borough Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000226",
    lpa_gss_code: "E60000284",
    pdgov_organisation: "local-authority:CRW",
    pdgov_org_entity: "99",
    pdgov_lpa_entity: "626284",
    planit_area_name: "Crawley",
    planit_area_id: 248,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 22408,
    planning_portal_url: "https://planningregister.crawley.gov.uk/Search/Advanced/#AdvancedSearchTab",
    website: "https://www.crawley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cumberland Council",
    nation: "England",
    region: "",
    county: "",
    type: "unitary",
    gss_code: "E06000063",
    lpa_gss_code: "E60000334",
    pdgov_organisation: "local-authority:CUA",
    pdgov_org_entity: "10000",
    pdgov_lpa_entity: "626334",
    planit_area_name: "Cumberland",
    planit_area_id: 522,
    planit_covered: "yes (via legacy/child areas)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.cumberland.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt areas: Allerdale (Arcus), Carlisle (Idox), Copeland (Custom)",
    api_notes: "PlanIt API: yes (via legacy/child areas); planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Dacorum Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000096",
    lpa_gss_code: "E60000167",
    pdgov_organisation: "local-authority:DAC",
    pdgov_org_entity: "101",
    pdgov_lpa_entity: "626167",
    planit_area_name: "Dacorum",
    planit_area_id: 129,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 63796,
    planning_portal_url: "https://planning.dacorum.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.dacorum.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Darlington Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000005",
    lpa_gss_code: "E60000002",
    pdgov_organisation: "local-authority:DAL",
    pdgov_org_entity: "102",
    pdgov_lpa_entity: "626002",
    planit_area_name: "Darlington",
    planit_area_id: 5,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 27540,
    planning_portal_url: "https://publicaccess.darlington.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.darlington.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dartford Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000107",
    lpa_gss_code: "E60000255",
    pdgov_organisation: "local-authority:DAR",
    pdgov_org_entity: "103",
    pdgov_lpa_entity: "626255",
    planit_area_name: "Dartford",
    planit_area_id: 140,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 29790,
    planning_portal_url: "https://publicaccess.dartford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.dartford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dartmoor National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000001",
    lpa_gss_code: "E60000318",
    pdgov_organisation: "national-park-authority:Q5225646",
    pdgov_org_entity: "400",
    pdgov_lpa_entity: "626318",
    planit_area_name: "Dartmoor",
    planit_area_id: 354,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-06",
    planit_total_apps: 19629,
    planning_portal_url: "https://dartmoor-online.tascomi.com/planning/index.html?fa=search",
    website: "https://www.dartmoor.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-06)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Derby City Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000015",
    lpa_gss_code: "E60000073",
    pdgov_organisation: "local-authority:DER",
    pdgov_org_entity: "107",
    pdgov_lpa_entity: "626073",
    planit_area_name: "Derby",
    planit_area_id: 15,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 43125,
    planning_portal_url: "https://eplanning.derby.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.derby.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Derbyshire Dales District Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000035",
    lpa_gss_code: "E60000080",
    pdgov_organisation: "local-authority:DEB",
    pdgov_org_entity: "106",
    pdgov_lpa_entity: "626080",
    planit_area_name: "Derbyshire Dales",
    planit_area_id: 75,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-14",
    planit_total_apps: 25400,
    planning_portal_url: "https://planning.derbyshiredales.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.derbyshiredales.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Doncaster Metropolitan Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000017",
    lpa_gss_code: "E60000065",
    pdgov_organisation: "local-authority:DNC",
    pdgov_org_entity: "109",
    pdgov_lpa_entity: "626065",
    planit_area_name: "Doncaster",
    planit_area_id: 274,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 60787,
    planning_portal_url: "https://planning.doncaster.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.doncaster.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dorset Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000059",
    lpa_gss_code: "E60000292",
    pdgov_organisation: "local-authority:DST",
    pdgov_org_entity: "112",
    pdgov_lpa_entity: "626292",
    planit_area_name: "Dorset",
    planit_area_id: 332,
    planit_covered: "yes",
    planit_scraper_type: "CCED",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 188621,
    planning_portal_url: "https://planning.dorsetcouncil.gov.uk/advsearch.aspx",
    website: "https://www.dorsetcouncil.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dover District Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000108",
    lpa_gss_code: "E60000256",
    pdgov_organisation: "local-authority:DOV",
    pdgov_org_entity: "111",
    pdgov_lpa_entity: "626256",
    planit_area_name: "Dover",
    planit_area_id: 141,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 45268,
    planning_portal_url: "https://publicaccess.dover.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.dover.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dudley Metropolitan Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000027",
    lpa_gss_code: "E60000132",
    pdgov_organisation: "local-authority:DUD",
    pdgov_org_entity: "113",
    pdgov_lpa_entity: "626132",
    planit_area_name: "Dudley",
    planit_area_id: 284,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 55210,
    planning_portal_url: "https://planning.agileapplications.co.uk/dudley/search-applications/",
    website: "https://www.dudley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Durham County Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000047",
    lpa_gss_code: "E60000001",
    pdgov_organisation: "local-authority:DUR",
    pdgov_org_entity: "114",
    pdgov_lpa_entity: "626001",
    planit_area_name: "Durham",
    planit_area_id: 47,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 119387,
    planning_portal_url: "https://publicaccess.durham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.durham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Cambridgeshire District Council",
    nation: "England",
    region: "East of England",
    county: "Cambridgeshire",
    type: "district",
    gss_code: "E07000009",
    lpa_gss_code: "E60000150",
    pdgov_organisation: "local-authority:ECA",
    pdgov_org_entity: "118",
    pdgov_lpa_entity: "626150",
    planit_area_name: "East Cambridgeshire",
    planit_area_id: 62,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 41009,
    planning_portal_url: "https://pa.eastcambs.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.eastcambs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Devon District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000040",
    lpa_gss_code: "E60000300",
    pdgov_organisation: "local-authority:EDE",
    pdgov_org_entity: "119",
    pdgov_lpa_entity: "626300",
    planit_area_name: "East Devon",
    planit_area_id: 80,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 65766,
    planning_portal_url: "https://planning.eastdevon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://eastdevon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Hampshire District Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000085",
    lpa_gss_code: "E60000243",
    pdgov_organisation: "local-authority:EHA",
    pdgov_org_entity: "122",
    pdgov_lpa_entity: "626243",
    planit_area_name: "East Hampshire",
    planit_area_id: 118,
    planit_covered: "yes",
    planit_scraper_type: "Idox Tascomi",
    planit_latest_app_date: "2026-07-08",
    planit_total_apps: 48275,
    planning_portal_url: "https://publicaccess.easthants.gov.uk/planning/index.html?fa=search",
    website: "https://www.easthants.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-08)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Hertfordshire District Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000242",
    lpa_gss_code: "E60000168",
    pdgov_organisation: "local-authority:EHE",
    pdgov_org_entity: "123",
    pdgov_lpa_entity: "626168",
    planit_area_name: "East Hertfordshire",
    planit_area_id: 130,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 61146,
    planning_portal_url: "https://publicaccess.eastherts.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.eastherts.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Lindsey District Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000137",
    lpa_gss_code: "E60000093",
    pdgov_organisation: "local-authority:ELI",
    pdgov_org_entity: "124",
    pdgov_lpa_entity: "626093",
    planit_area_name: "East Lindsey",
    planit_area_id: 170,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 43644,
    planning_portal_url: "https://publicaccess.e-lindsey.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.e-lindsey.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Riding of Yorkshire Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000011",
    lpa_gss_code: "E60000052",
    pdgov_organisation: "local-authority:ERY",
    pdgov_org_entity: "131",
    pdgov_lpa_entity: "626052",
    planit_area_name: "East Riding",
    planit_area_id: 11,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 104033,
    planning_portal_url: "https://newplanningaccess.eastriding.gov.uk/newplanningaccess/search.do?action=advanced",
    website: "https://www.eastriding.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Staffordshire Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000193",
    lpa_gss_code: "E60000118",
    pdgov_organisation: "local-authority:EST",
    pdgov_org_entity: "134",
    pdgov_lpa_entity: "626118",
    planit_area_name: "East Staffordshire",
    planit_area_id: 215,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 39583,
    planning_portal_url: "https://eaststaffs-publicportal.statmap.co.uk/horizoNext/publicportal",
    website: "https://www.eaststaffsbc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Suffolk Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000244",
    lpa_gss_code: "E60000184",
    pdgov_organisation: "local-authority:ESK",
    pdgov_org_entity: "132",
    pdgov_lpa_entity: "626184",
    planit_area_name: "East Suffolk",
    planit_area_id: 509,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 95977,
    planning_portal_url: "https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.eastsuffolk.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Eastbourne Borough Council",
    nation: "England",
    region: "South East",
    county: "East Sussex",
    type: "district",
    gss_code: "E07000061",
    lpa_gss_code: "E60000237",
    pdgov_organisation: "local-authority:EAS",
    pdgov_org_entity: "116",
    pdgov_lpa_entity: "626237",
    planit_area_name: "Eastbourne",
    planit_area_id: 94,
    planit_covered: "yes",
    planit_scraper_type: "CivicaJson",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 26724,
    planning_portal_url: "https://www.lewes-eastbourne.gov.uk/planning/",
    website: "https://www.eastbourne.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Eastleigh Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000086",
    lpa_gss_code: "E60000244",
    pdgov_organisation: "local-authority:EAT",
    pdgov_org_entity: "117",
    pdgov_lpa_entity: "626244",
    planit_area_name: "Eastleigh",
    planit_area_id: 119,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 41104,
    planning_portal_url: "https://planning.eastleigh.gov.uk/s/public-register",
    website: "https://www.eastleigh.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ebbsfleet Development Corporation",
    nation: "England",
    region: "",
    county: "",
    type: "development corporation",
    gss_code: "E51000003",
    lpa_gss_code: "E60000328",
    pdgov_organisation: "development-corporation:Q72463795",
    pdgov_org_entity: "6",
    pdgov_lpa_entity: "626328",
    planit_area_name: "",
    planit_area_id: "",
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://ebbsfleetdc.org.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url,planit_area_id"
  },
  {
    name: "Elmbridge Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000207",
    lpa_gss_code: "E60000270",
    pdgov_organisation: "local-authority:ELM",
    pdgov_org_entity: "125",
    pdgov_lpa_entity: "626270",
    planit_area_name: "Elmbridge",
    planit_area_id: 229,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-09-30",
    planit_total_apps: 85357,
    planning_portal_url: "https://emaps.elmbridge.gov.uk/ebc_planning.aspx?requesttype=parseTemplate&template=AdvancedSearchTab.tmplt",
    website: "https://www.elmbridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Epping Forest District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000072",
    lpa_gss_code: "E60000160",
    pdgov_organisation: "local-authority:EPP",
    pdgov_org_entity: "128",
    pdgov_lpa_entity: "626160",
    planit_area_name: "Epping Forest",
    planit_area_id: 105,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 71579,
    planning_portal_url: "https://eppingforestdc.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.eppingforestdc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Epsom and Ewell Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000208",
    lpa_gss_code: "E60000271",
    pdgov_organisation: "local-authority:EPS",
    pdgov_org_entity: "129",
    pdgov_lpa_entity: "626271",
    planit_area_name: "Epsom and Ewell",
    planit_area_id: 230,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 35341,
    planning_portal_url: "https://eplanning.epsom-ewell.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.epsom-ewell.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Erewash Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000036",
    lpa_gss_code: "E60000081",
    pdgov_organisation: "local-authority:ERE",
    pdgov_org_entity: "130",
    pdgov_lpa_entity: "626081",
    planit_area_name: "Erewash",
    planit_area_id: 76,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 22229,
    planning_portal_url: "https://planning.erewash.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.erewash.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Exeter City Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000041",
    lpa_gss_code: "E60000301",
    pdgov_organisation: "local-authority:EXE",
    pdgov_org_entity: "136",
    pdgov_lpa_entity: "626301",
    planit_area_name: "Exeter",
    planit_area_id: 81,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 33080,
    planning_portal_url: "https://publicaccess.exeter.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.exeter.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Exmoor National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000002",
    lpa_gss_code: "E60000319",
    pdgov_organisation: "national-park-authority:Q72617784",
    pdgov_org_entity: "403",
    pdgov_lpa_entity: "626319",
    planit_area_name: "Exmoor",
    planit_area_id: 355,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 9257,
    planning_portal_url: "https://exmoor.planning-register.co.uk/Search/Results/",
    website: "https://www.exmoor-nationalpark.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Fareham Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000087",
    lpa_gss_code: "E60000245",
    pdgov_organisation: "local-authority:FAR",
    pdgov_org_entity: "137",
    pdgov_lpa_entity: "626245",
    planit_area_name: "Fareham",
    planit_area_id: 120,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 42279,
    planning_portal_url: "https://www.fareham.gov.uk/casetrackerplanning/ApplicationSearch.aspx?search=true",
    website: "https://www.fareham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Fenland District Council",
    nation: "England",
    region: "East of England",
    county: "Cambridgeshire",
    type: "district",
    gss_code: "E07000010",
    lpa_gss_code: "E60000151",
    pdgov_organisation: "local-authority:FEN",
    pdgov_org_entity: "138",
    pdgov_lpa_entity: "626151",
    planit_area_name: "Fenland",
    planit_area_id: 63,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-15",
    planit_total_apps: 33461,
    planning_portal_url: "https://www.publicaccess.fenland.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.fenland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Folkestone and Hythe Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000112",
    lpa_gss_code: "E60000257",
    pdgov_organisation: "local-authority:SHE",
    pdgov_org_entity: "293",
    pdgov_lpa_entity: "626257",
    planit_area_name: "Shepway",
    planit_area_id: 145,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 37142,
    planning_portal_url: "https://folkestonehythedc.my.site.com/PR3/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.folkestone-hythe.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Forest of Dean District Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000080",
    lpa_gss_code: "E60000310",
    pdgov_organisation: "local-authority:FOE",
    pdgov_org_entity: "139",
    pdgov_lpa_entity: "626310",
    planit_area_name: "Forest of Dean",
    planit_area_id: 113,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 34916,
    planning_portal_url: "https://publicaccess.fdean.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.fdean.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Fylde Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000119",
    lpa_gss_code: "E60000037",
    pdgov_organisation: "local-authority:FYL",
    pdgov_org_entity: "141",
    pdgov_lpa_entity: "626037",
    planit_area_name: "Fylde",
    planit_area_id: 152,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 27258,
    planning_portal_url: "https://pa.fylde.gov.uk/Search/Advanced/",
    website: "https://www.fylde.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gateshead Metropolitan Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000037",
    lpa_gss_code: "E60000008",
    pdgov_organisation: "local-authority:GAT",
    pdgov_org_entity: "142",
    pdgov_lpa_entity: "626008",
    planit_area_name: "Gateshead",
    planit_area_id: 277,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 32100,
    planning_portal_url: "https://public.gateshead.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.gateshead.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gedling Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000173",
    lpa_gss_code: "E60000109",
    pdgov_organisation: "local-authority:GED",
    pdgov_org_entity: "143",
    pdgov_lpa_entity: "626109",
    planit_area_name: "Gedling",
    planit_area_id: 200,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 24054,
    planning_portal_url: "https://pawam.gedling.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.gedling.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gloucester City Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000081",
    lpa_gss_code: "E60000311",
    pdgov_organisation: "local-authority:GLO",
    pdgov_org_entity: "145",
    pdgov_lpa_entity: "626311",
    planit_area_name: "Gloucester",
    planit_area_id: 114,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 24431,
    planning_portal_url: "https://publicaccess.gloucester.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.gloucester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gosport Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000088",
    lpa_gss_code: "E60000246",
    pdgov_organisation: "local-authority:GOS",
    pdgov_org_entity: "148",
    pdgov_lpa_entity: "626246",
    planit_area_name: "Gosport",
    planit_area_id: 121,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 12382,
    planning_portal_url: "https://publicaccess.gosport.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.gosport.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gravesham Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000109",
    lpa_gss_code: "E60000258",
    pdgov_organisation: "local-authority:GRA",
    pdgov_org_entity: "149",
    pdgov_lpa_entity: "626258",
    planit_area_name: "Gravesham",
    planit_area_id: 142,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 28763,
    planning_portal_url: "https://plan.gravesham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.gravesham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Great Yarmouth Borough Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000145",
    lpa_gss_code: "E60000178",
    pdgov_organisation: "local-authority:GRY",
    pdgov_org_entity: "152",
    pdgov_lpa_entity: "626178",
    planit_area_name: "Great Yarmouth",
    planit_area_id: 178,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 24139,
    planning_portal_url: "https://planning.great-yarmouth.gov.uk/OcellaWeb/planningSearch",
    website: "https://www.great-yarmouth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Guildford Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000209",
    lpa_gss_code: "E60000272",
    pdgov_organisation: "local-authority:GRT",
    pdgov_org_entity: "151",
    pdgov_lpa_entity: "626272",
    planit_area_name: "Guildford",
    planit_area_id: 231,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 75309,
    planning_portal_url: "https://publicaccess.guildford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.guildford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Halton Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000006",
    lpa_gss_code: "E60000017",
    pdgov_organisation: "local-authority:HAL",
    pdgov_org_entity: "156",
    pdgov_lpa_entity: "626017",
    planit_area_name: "Halton",
    planit_area_id: 6,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 18680,
    planning_portal_url: "https://pa.halton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.halton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Harborough District Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000131",
    lpa_gss_code: "E60000087",
    pdgov_organisation: "local-authority:HAO",
    pdgov_org_entity: "158",
    pdgov_lpa_entity: "626087",
    planit_area_name: "Harborough",
    planit_area_id: 164,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-15",
    planit_total_apps: 44362,
    planning_portal_url: "https://pa2.harborough.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.harborough.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Harlow District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000073",
    lpa_gss_code: "E60000161",
    pdgov_organisation: "local-authority:HAR",
    pdgov_org_entity: "159",
    pdgov_lpa_entity: "626161",
    planit_area_name: "Harlow",
    planit_area_id: 106,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 16359,
    planning_portal_url: "https://planningonline.harlow.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.harlow.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hart District Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000089",
    lpa_gss_code: "E60000247",
    pdgov_organisation: "local-authority:HAT",
    pdgov_org_entity: "161",
    pdgov_lpa_entity: "626247",
    planit_area_name: "Hart",
    planit_area_id: 122,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 58434,
    planning_portal_url: "https://publicaccess.hart.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.hart.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hartlepool Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000001",
    lpa_gss_code: "E60000003",
    pdgov_organisation: "local-authority:HPL",
    pdgov_org_entity: "172",
    pdgov_lpa_entity: "626003",
    planit_area_name: "Hartlepool",
    planit_area_id: 1,
    planit_covered: "yes",
    planit_scraper_type: "AppSearchServ",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 17191,
    planning_portal_url: "https://planning.hartlepool.gov.uk/portal/servlets/ApplicationSearchServlet",
    website: "https://www.hartlepool.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hartlepool Development Corporation",
    nation: "England",
    region: "",
    county: "",
    type: "development corporation",
    gss_code: "E51000007",
    lpa_gss_code: "E60000340",
    pdgov_organisation: "development-corporation:Q124604981",
    pdgov_org_entity: "4700002",
    pdgov_lpa_entity: "",
    planit_area_name: "",
    planit_area_id: "",
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://teesvalley-ca.gov.uk/about/hartlepool-development-corporation/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url,planit_area_id"
  },
  {
    name: "Hastings Borough Council",
    nation: "England",
    region: "South East",
    county: "East Sussex",
    type: "district",
    gss_code: "E07000062",
    lpa_gss_code: "E60000238",
    pdgov_organisation: "local-authority:HAS",
    pdgov_org_entity: "160",
    pdgov_lpa_entity: "626238",
    planit_area_name: "Hastings",
    planit_area_id: 95,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 23810,
    planning_portal_url: "https://publicaccess.hastings.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.hastings.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Havant Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000090",
    lpa_gss_code: "E60000248",
    pdgov_organisation: "local-authority:HAA",
    pdgov_org_entity: "153",
    pdgov_lpa_entity: "626248",
    planit_area_name: "Havant",
    planit_area_id: 123,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 29588,
    planning_portal_url: "https://service.havant.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.havant.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Herefordshire Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000019",
    lpa_gss_code: "E60000113",
    pdgov_organisation: "local-authority:HEF",
    pdgov_org_entity: "164",
    pdgov_lpa_entity: "626113",
    planit_area_name: "Herefordshire",
    planit_area_id: 19,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 90252,
    planning_portal_url: "https://www.herefordshire.gov.uk/info/200142/planning_services/planning_application_search",
    website: "https://www.herefordshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hertsmere Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000098",
    lpa_gss_code: "E60000169",
    pdgov_organisation: "local-authority:HER",
    pdgov_org_entity: "165",
    pdgov_lpa_entity: "626169",
    planit_area_name: "Hertsmere",
    planit_area_id: 131,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 44330,
    planning_portal_url: "https://www6.hertsmere.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.hertsmere.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "High Peak Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000037",
    lpa_gss_code: "E60000082",
    pdgov_organisation: "local-authority:HIG",
    pdgov_org_entity: "166",
    pdgov_lpa_entity: "626082",
    planit_area_name: "High Peak",
    planit_area_id: 77,
    planit_covered: "yes",
    planit_scraper_type: "AppSearchServ",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 24188,
    planning_portal_url: "http://planning.highpeak.gov.uk/portal/servlets/ApplicationSearchServlet",
    website: "https://www.highpeak.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hinckley and Bosworth Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000132",
    lpa_gss_code: "E60000088",
    pdgov_organisation: "local-authority:HIN",
    pdgov_org_entity: "168",
    pdgov_lpa_entity: "626088",
    planit_area_name: "Hinckley and Bosworth",
    planit_area_id: 165,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-07-08",
    planit_total_apps: 31821,
    planning_portal_url: "https://pa.hinckley-bosworth.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.hinckley-bosworth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-08)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Horsham District Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000227",
    lpa_gss_code: "E60000285",
    pdgov_organisation: "local-authority:HOR",
    pdgov_org_entity: "171",
    pdgov_lpa_entity: "626285",
    planit_area_name: "Horsham",
    planit_area_id: 249,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 68052,
    planning_portal_url: "https://public-access.horsham.gov.uk/public-access/search.do?action=advanced",
    website: "https://www.horsham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hull City Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000010",
    lpa_gss_code: "E60000053",
    pdgov_organisation: "local-authority:KHL",
    pdgov_org_entity: "185",
    pdgov_lpa_entity: "626053",
    planit_area_name: "Hull",
    planit_area_id: 10,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 33191,
    planning_portal_url: "https://www.hullcc.gov.uk/padcbc/publicaccess-live/search.do?action=advanced",
    website: "https://www.hullcc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Huntingdonshire District Council",
    nation: "England",
    region: "East of England",
    county: "Cambridgeshire",
    type: "district",
    gss_code: "E07000011",
    lpa_gss_code: "E60000152",
    pdgov_organisation: "local-authority:HUN",
    pdgov_org_entity: "176",
    pdgov_lpa_entity: "626152",
    planit_area_name: "Huntingdonshire",
    planit_area_id: 64,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 63733,
    planning_portal_url: "https://publicaccess.huntingdonshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.huntingdonshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hyndburn Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000120",
    lpa_gss_code: "E60000038",
    pdgov_organisation: "local-authority:HYN",
    pdgov_org_entity: "177",
    pdgov_lpa_entity: "626038",
    planit_area_name: "Hyndburn",
    planit_area_id: 153,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 15859,
    planning_portal_url: "https://planning.hyndburnbc.gov.uk/Northgate/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.hyndburnbc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ipswich Borough Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000202",
    lpa_gss_code: "E60000185",
    pdgov_organisation: "local-authority:IPS",
    pdgov_org_entity: "180",
    pdgov_lpa_entity: "626185",
    planit_area_name: "Ipswich",
    planit_area_id: 224,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 29685,
    planning_portal_url: "https://ppc.ipswich.gov.uk/appnsearch.asp",
    website: "https://www.ipswich.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Isle of Wight Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000046",
    lpa_gss_code: "E60000223",
    pdgov_organisation: "local-authority:IOW",
    pdgov_org_entity: "179",
    pdgov_lpa_entity: "626223",
    planit_area_name: "Isle of Wight",
    planit_area_id: 46,
    planit_covered: "yes",
    planit_scraper_type: "Idox Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 55088,
    planning_portal_url: "https://publicaccess.iow.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.iow.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Kirklees Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000034",
    lpa_gss_code: "E60000070",
    pdgov_organisation: "local-authority:KIR",
    pdgov_org_entity: "187",
    pdgov_lpa_entity: "626070",
    planit_area_name: "Kirklees",
    planit_area_id: 291,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 112079,
    planning_portal_url: "https://www.kirklees.gov.uk/beta/planning-applications/search-for-planning-applications/default.aspx",
    website: "https://www.kirklees.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Knowsley Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000011",
    lpa_gss_code: "E60000047",
    pdgov_organisation: "local-authority:KWL",
    pdgov_org_entity: "189",
    pdgov_lpa_entity: "626047",
    planit_area_name: "Knowsley",
    planit_area_id: 268,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 19758,
    planning_portal_url: "https://planapp.knowsley.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.knowsley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Lake District National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000011",
    lpa_gss_code: "E60000320",
    pdgov_organisation: "national-park-authority:Q27159704",
    pdgov_org_entity: "397",
    pdgov_lpa_entity: "626320",
    planit_area_name: "Lake District",
    planit_area_id: 356,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 39217,
    planning_portal_url: "https://planning.agileapplications.co.uk/ldnpa/search-applications/",
    website: "https://www.lakedistrict.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Lancaster City Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000121",
    lpa_gss_code: "E60000039",
    pdgov_organisation: "local-authority:LAC",
    pdgov_org_entity: "190",
    pdgov_lpa_entity: "626039",
    planit_area_name: "Lancaster",
    planit_area_id: 154,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 38218,
    planning_portal_url: "https://planning.lancaster.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lancaster.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Leeds City Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000035",
    lpa_gss_code: "E60000071",
    pdgov_organisation: "local-authority:LDS",
    pdgov_org_entity: "195",
    pdgov_lpa_entity: "626071",
    planit_area_name: "Leeds",
    planit_area_id: 292,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 191677,
    planning_portal_url: "https://publicaccess.leeds.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.leeds.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Leicester City Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000016",
    lpa_gss_code: "E60000074",
    pdgov_organisation: "local-authority:LCE",
    pdgov_org_entity: "193",
    pdgov_lpa_entity: "626074",
    planit_area_name: "Leicester",
    planit_area_id: 16,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 60300,
    planning_portal_url: "https://planning.leicester.gov.uk/Search/Advanced/",
    website: "https://www.leicester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Lewes District Council",
    nation: "England",
    region: "South East",
    county: "East Sussex",
    type: "district",
    gss_code: "E07000063",
    lpa_gss_code: "E60000239",
    pdgov_organisation: "local-authority:LEE",
    pdgov_org_entity: "197",
    pdgov_lpa_entity: "626239",
    planit_area_name: "Lewes",
    planit_area_id: 96,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 29158,
    planning_portal_url: "https://planningpa.lewes-eastbourne.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lewes-eastbourne.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Lichfield District Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000194",
    lpa_gss_code: "E60000119",
    pdgov_organisation: "local-authority:LIF",
    pdgov_org_entity: "200",
    pdgov_lpa_entity: "626119",
    planit_area_name: "Lichfield",
    planit_area_id: 216,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 31402,
    planning_portal_url: "https://planning.lichfielddc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lichfielddc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Liverpool City Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000012",
    lpa_gss_code: "E60000048",
    pdgov_organisation: "local-authority:LIV",
    pdgov_org_entity: "202",
    pdgov_lpa_entity: "626048",
    planit_area_name: "Liverpool",
    planit_area_id: 269,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-08",
    planit_total_apps: 97709,
    planning_portal_url: "https://lar.liverpool.gov.uk/planning/index.html?fa=search",
    website: "https://www.liverpool.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-08)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Barking and Dagenham",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000002",
    lpa_gss_code: "E60000202",
    pdgov_organisation: "local-authority:BDG",
    pdgov_org_entity: "41",
    pdgov_lpa_entity: "626202",
    planit_area_name: "Barking and Dagenham",
    planit_area_id: 295,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-04",
    planit_total_apps: 35748,
    planning_portal_url: "https://online-befirst.lbbd.gov.uk/planning/index.html?fa=search",
    website: "https://www.lbbd.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-04)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Barnet",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000003",
    lpa_gss_code: "E60000203",
    pdgov_organisation: "local-authority:BNE",
    pdgov_org_entity: "48",
    pdgov_lpa_entity: "626203",
    planit_area_name: "Barnet",
    planit_area_id: 296,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 177156,
    planning_portal_url: "https://publicaccess.barnet.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.barnet.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Bexley",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000004",
    lpa_gss_code: "E60000204",
    pdgov_organisation: "local-authority:BEX",
    pdgov_org_entity: "43",
    pdgov_lpa_entity: "626204",
    planit_area_name: "Bexley",
    planit_area_id: 297,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 62495,
    planning_portal_url: "https://pa.bexley.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.bexley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Brent",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000005",
    lpa_gss_code: "E60000205",
    pdgov_organisation: "local-authority:BEN",
    pdgov_org_entity: "42",
    pdgov_lpa_entity: "626205",
    planit_area_name: "Brent",
    planit_area_id: 298,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 105642,
    planning_portal_url: "https://pa.brent.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.brent.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Bromley",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000006",
    lpa_gss_code: "E60000206",
    pdgov_organisation: "local-authority:BRY",
    pdgov_org_entity: "65",
    pdgov_lpa_entity: "626206",
    planit_area_name: "Bromley",
    planit_area_id: 299,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 128015,
    planning_portal_url: "https://planningaccess.bromley.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.bromley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Camden",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000007",
    lpa_gss_code: "E60000188",
    pdgov_organisation: "local-authority:CMD",
    pdgov_org_entity: "90",
    pdgov_lpa_entity: "626188",
    planit_area_name: "Camden",
    planit_area_id: 300,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 138503,
    planning_portal_url: "https://opendata.camden.gov.uk/Environment/Planning-Applications/2eiu-s2cw/about_data",
    website: "https://www.camden.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Croydon",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000008",
    lpa_gss_code: "E60000207",
    pdgov_organisation: "local-authority:CRY",
    pdgov_org_entity: "100",
    pdgov_lpa_entity: "626207",
    planit_area_name: "Croydon",
    planit_area_id: 301,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 110746,
    planning_portal_url: "https://publicaccess3.croydon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.croydon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Ealing",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000009",
    lpa_gss_code: "E60000208",
    pdgov_organisation: "local-authority:EAL",
    pdgov_org_entity: "115",
    pdgov_lpa_entity: "626208",
    planit_area_name: "Ealing",
    planit_area_id: 302,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 132685,
    planning_portal_url: "https://pam.ealing.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.ealing.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Enfield",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000010",
    lpa_gss_code: "E60000209",
    pdgov_organisation: "local-authority:ENF",
    pdgov_org_entity: "126",
    pdgov_lpa_entity: "626209",
    planit_area_name: "Enfield",
    planit_area_id: 303,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 96705,
    planning_portal_url: "https://planningandbuildingcontrol.enfield.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.enfield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Hackney",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000012",
    lpa_gss_code: "E60000190",
    pdgov_organisation: "local-authority:HCK",
    pdgov_org_entity: "163",
    pdgov_lpa_entity: "626190",
    planit_area_name: "Hackney",
    planit_area_id: 305,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 79208,
    planning_portal_url: "https://developmentandhousing.hackney.gov.uk/planning/index.html?fa=search",
    website: "https://www.hackney.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Hammersmith & Fulham",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000013",
    lpa_gss_code: "E60000191",
    pdgov_organisation: "local-authority:HMF",
    pdgov_org_entity: "169",
    pdgov_lpa_entity: "626191",
    planit_area_name: "Hammersmith and Fulham",
    planit_area_id: 306,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 96611,
    planning_portal_url: "https://property.lbhf.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.lbhf.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Haringey",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000014",
    lpa_gss_code: "E60000192",
    pdgov_organisation: "local-authority:HRY",
    pdgov_org_entity: "175",
    pdgov_lpa_entity: "626192",
    planit_area_name: "Haringey",
    planit_area_id: 307,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 80838,
    planning_portal_url: "https://publicregister.haringey.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.haringey.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Harrow",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000015",
    lpa_gss_code: "E60000211",
    pdgov_organisation: "local-authority:HRW",
    pdgov_org_entity: "174",
    pdgov_lpa_entity: "626211",
    planit_area_name: "Harrow",
    planit_area_id: 308,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 98798,
    planning_portal_url: "https://planningsearch.harrow.gov.uk/planning/index.html?fa=search",
    website: "https://www.harrow.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Havering",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000016",
    lpa_gss_code: "E60000212",
    pdgov_organisation: "local-authority:HAV",
    pdgov_org_entity: "162",
    pdgov_lpa_entity: "626212",
    planit_area_name: "Havering",
    planit_area_id: 309,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 76252,
    planning_portal_url: "https://development.havering.gov.uk/OcellaWeb/planningSearch",
    website: "https://www.havering.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Hillingdon",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000017",
    lpa_gss_code: "E60000213",
    pdgov_organisation: "local-authority:HIL",
    pdgov_org_entity: "167",
    pdgov_lpa_entity: "626213",
    planit_area_name: "Hillingdon",
    planit_area_id: 310,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 100777,
    planning_portal_url: "https://planning.hillingdon.gov.uk/OcellaWeb/planningSearch",
    website: "https://www.hillingdon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Hounslow",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000018",
    lpa_gss_code: "E60000214",
    pdgov_organisation: "local-authority:HNS",
    pdgov_org_entity: "170",
    pdgov_lpa_entity: "626214",
    planit_area_name: "Hounslow",
    planit_area_id: 311,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 105425,
    planning_portal_url: "https://planningandbuilding.hounslow.gov.uk/NECSWS/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.hounslow.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Islington",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000019",
    lpa_gss_code: "E60000193",
    pdgov_organisation: "local-authority:ISL",
    pdgov_org_entity: "181",
    pdgov_lpa_entity: "626193",
    planit_area_name: "Islington",
    planit_area_id: 312,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 90247,
    planning_portal_url: "https://planning.agileapplications.co.uk/islington/search-applications/",
    website: "https://www.islington.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Lambeth",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000022",
    lpa_gss_code: "E60000195",
    pdgov_organisation: "local-authority:LBH",
    pdgov_org_entity: "192",
    pdgov_lpa_entity: "626195",
    planit_area_name: "Lambeth",
    planit_area_id: 315,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 102174,
    planning_portal_url: "https://planning.lambeth.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lambeth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Lewisham",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000023",
    lpa_gss_code: "E60000196",
    pdgov_organisation: "local-authority:LEW",
    pdgov_org_entity: "198",
    pdgov_lpa_entity: "626196",
    planit_area_name: "Lewisham",
    planit_area_id: 316,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 100731,
    planning_portal_url: "https://planning.lewisham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.lewisham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Merton",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000024",
    lpa_gss_code: "E60000216",
    pdgov_organisation: "local-authority:MRT",
    pdgov_org_entity: "217",
    pdgov_lpa_entity: "626216",
    planit_area_name: "Merton",
    planit_area_id: 317,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 91338,
    planning_portal_url: "https://rspandlp.merton.gov.uk/planning/index.html?fa=search",
    website: "https://www.merton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Newham",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000025",
    lpa_gss_code: "E60000197",
    pdgov_organisation: "local-authority:NWM",
    pdgov_org_entity: "246",
    pdgov_lpa_entity: "626197",
    planit_area_name: "Newham",
    planit_area_id: 318,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 61325,
    planning_portal_url: "https://pa.newham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.newham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Redbridge",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000026",
    lpa_gss_code: "E60000217",
    pdgov_organisation: "local-authority:RDB",
    pdgov_org_entity: "261",
    pdgov_lpa_entity: "626217",
    planit_area_name: "Redbridge",
    planit_area_id: 319,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 111488,
    planning_portal_url: "https://planning.agileapplications.co.uk/redbridge/search-applications/",
    website: "https://www.redbridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Richmond upon Thames",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000027",
    lpa_gss_code: "E60000218",
    pdgov_organisation: "local-authority:RIC",
    pdgov_org_entity: "266",
    pdgov_lpa_entity: "626218",
    planit_area_name: "Richmond",
    planit_area_id: 320,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 141250,
    planning_portal_url: "https://planning.agileapplications.co.uk/richmond/search-applications/",
    website: "https://www.richmond.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Southwark",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000028",
    lpa_gss_code: "E60000198",
    pdgov_organisation: "local-authority:SWK",
    pdgov_org_entity: "329",
    pdgov_lpa_entity: "626198",
    planit_area_name: "Southwark",
    planit_area_id: 321,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 94586,
    planning_portal_url: "https://planning.southwark.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southwark.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Sutton",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000029",
    lpa_gss_code: "E60000219",
    pdgov_organisation: "local-authority:STN",
    pdgov_org_entity: "319",
    pdgov_lpa_entity: "626219",
    planit_area_name: "Sutton",
    planit_area_id: 322,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 55129,
    planning_portal_url: "https://planningregister.sutton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sutton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Tower Hamlets",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000030",
    lpa_gss_code: "E60000199",
    pdgov_organisation: "local-authority:TWH",
    pdgov_org_entity: "350",
    pdgov_lpa_entity: "626199",
    planit_area_name: "Tower Hamlets",
    planit_area_id: 323,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 84875,
    planning_portal_url: "https://development.towerhamlets.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.towerhamlets.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Waltham Forest",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000031",
    lpa_gss_code: "E60000220",
    pdgov_organisation: "local-authority:WFT",
    pdgov_org_entity: "366",
    pdgov_lpa_entity: "626220",
    planit_area_name: "Waltham Forest",
    planit_area_id: 324,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 70401,
    planning_portal_url: "https://placehub.walthamforest.gov.uk/planning/index.html?fa=search",
    website: "https://www.walthamforest.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "London Borough of Wandsworth",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000032",
    lpa_gss_code: "E60000200",
    pdgov_organisation: "local-authority:WND",
    pdgov_org_entity: "376",
    pdgov_lpa_entity: "626200",
    planit_area_name: "Wandsworth",
    planit_area_id: 325,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-09-11",
    planit_total_apps: 143553,
    planning_portal_url: "https://planning.wandsworth.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx",
    website: "https://www.wandsworth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Luton Borough Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000032",
    lpa_gss_code: "E60000145",
    pdgov_organisation: "local-authority:LUT",
    pdgov_org_entity: "204",
    pdgov_lpa_entity: "626145",
    planit_area_name: "Luton",
    planit_area_id: 32,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 41744,
    planning_portal_url: "https://planning.luton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.luton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Maidstone Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000110",
    lpa_gss_code: "E60000259",
    pdgov_organisation: "local-authority:MAI",
    pdgov_org_entity: "205",
    pdgov_lpa_entity: "626259",
    planit_area_name: "Maidstone",
    planit_area_id: 143,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://pa.midkent.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.maidstone.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Mid Kent' (id 508, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Maldon District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000074",
    lpa_gss_code: "E60000162",
    pdgov_organisation: "local-authority:MAL",
    pdgov_org_entity: "206",
    pdgov_lpa_entity: "626162",
    planit_area_name: "Maldon",
    planit_area_id: 107,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 32479,
    planning_portal_url: "https://publicaccess.maldon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.maldon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Malvern Hills District Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000235",
    lpa_gss_code: "E60000138",
    pdgov_organisation: "local-authority:MAV",
    pdgov_org_entity: "209",
    pdgov_lpa_entity: "626138",
    planit_area_name: "Malvern Hills",
    planit_area_id: 253,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 42615,
    planning_portal_url: "https://plan.malvernhills.gov.uk/Search/Advanced/",
    website: "https://www.malvernhills.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Manchester City Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000003",
    lpa_gss_code: "E60000027",
    pdgov_organisation: "local-authority:MAN",
    pdgov_org_entity: "207",
    pdgov_lpa_entity: "626027",
    planit_area_name: "Manchester",
    planit_area_id: 260,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 88049,
    planning_portal_url: "https://arcusbe.manchester.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.manchester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mansfield District Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000174",
    lpa_gss_code: "E60000110",
    pdgov_organisation: "local-authority:MAS",
    pdgov_org_entity: "208",
    pdgov_lpa_entity: "626110",
    planit_area_name: "Mansfield",
    planit_area_id: 201,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 18139,
    planning_portal_url: "https://planning.mansfield.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.mansfield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Medway Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000035",
    lpa_gss_code: "E60000224",
    pdgov_organisation: "local-authority:MDW",
    pdgov_org_entity: "212",
    pdgov_lpa_entity: "626224",
    planit_area_name: "Medway",
    planit_area_id: 35,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 55992,
    planning_portal_url: "https://publicaccess1.medway.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.medway.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Melton Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000133",
    lpa_gss_code: "E60000089",
    pdgov_organisation: "local-authority:MEL",
    pdgov_org_entity: "213",
    pdgov_lpa_entity: "626089",
    planit_area_name: "Melton",
    planit_area_id: 166,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 23257,
    planning_portal_url: "https://pa.melton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.melton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mid Devon District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000042",
    lpa_gss_code: "E60000302",
    pdgov_organisation: "local-authority:MDE",
    pdgov_org_entity: "211",
    pdgov_lpa_entity: "626302",
    planit_area_name: "Mid Devon",
    planit_area_id: 82,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 37947,
    planning_portal_url: "https://planning.middevon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.middevon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mid Suffolk District Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000203",
    lpa_gss_code: "E60000186",
    pdgov_organisation: "local-authority:MSU",
    pdgov_org_entity: "219",
    pdgov_lpa_entity: "626186",
    planit_area_name: "Mid Suffolk",
    planit_area_id: 225,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.baberghmidsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.midsuffolk.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Babergh Mid Suffolk' (id 511, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mid Sussex District Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000228",
    lpa_gss_code: "E60000286",
    pdgov_organisation: "local-authority:MSS",
    pdgov_org_entity: "218",
    pdgov_lpa_entity: "626286",
    planit_area_name: "Mid Sussex",
    planit_area_id: 250,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 62790,
    planning_portal_url: "https://pa.midsussex.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.midsussex.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Middlesbrough Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000002",
    lpa_gss_code: "E60000004",
    pdgov_organisation: "local-authority:MDB",
    pdgov_org_entity: "210",
    pdgov_lpa_entity: "626004",
    planit_area_name: "Middlesbrough",
    planit_area_id: 2,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 22260,
    planning_portal_url: "https://planning.agileapplications.co.uk/middlesbrough/search-applications/",
    website: "https://www.middlesbrough.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Middlesbrough Development Corporation",
    nation: "England",
    region: "",
    county: "",
    type: "development corporation",
    gss_code: "E51000006",
    lpa_gss_code: "E60000341",
    pdgov_organisation: "development-corporation:Q117149370",
    pdgov_org_entity: "4700001",
    pdgov_lpa_entity: "",
    planit_area_name: "",
    planit_area_id: "",
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://teesvalley-ca.gov.uk/about/middlesbrough-development-corporation/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "no PlanIt area found (gap; applications may be decided/recorded by host council - not verified)",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url,planit_area_id"
  },
  {
    name: "Milton Keynes City Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000042",
    lpa_gss_code: "E60000225",
    pdgov_organisation: "local-authority:MIK",
    pdgov_org_entity: "215",
    pdgov_lpa_entity: "626225",
    planit_area_name: "Milton Keynes",
    planit_area_id: 42,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 56155,
    planning_portal_url: "https://www.be.milton-keynes.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.milton-keynes.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mole Valley District Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000210",
    lpa_gss_code: "E60000273",
    pdgov_organisation: "local-authority:MOL",
    pdgov_org_entity: "216",
    pdgov_lpa_entity: "626273",
    planit_area_name: "Mole Valley",
    planit_area_id: 232,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 56352,
    planning_portal_url: "https://molevalley-publicportal.statmap.co.uk/horizoNext/publicportal",
    website: "https://www.molevalley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "New Forest District Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000091",
    lpa_gss_code: "E60000249",
    pdgov_organisation: "local-authority:NEW",
    pdgov_org_entity: "229",
    pdgov_lpa_entity: "626249",
    planit_area_name: "New Forest (District)",
    planit_area_id: 124,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 51628,
    planning_portal_url: "https://planning.newforest.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.newforestdc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "New Forest National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000009",
    lpa_gss_code: "E60000321",
    pdgov_organisation: "national-park-authority:Q72617158",
    pdgov_org_entity: "401",
    pdgov_lpa_entity: "626321",
    planit_area_name: "New Forest (Park)",
    planit_area_id: 362,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 51958,
    planning_portal_url: "https://planning.agileapplications.co.uk/nfnpa/search-applications/",
    website: "https://www.newforestnpa.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Newark and Sherwood District Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000175",
    lpa_gss_code: "E60000111",
    pdgov_organisation: "local-authority:NEA",
    pdgov_org_entity: "223",
    pdgov_lpa_entity: "626111",
    planit_area_name: "Newark and Sherwood",
    planit_area_id: 202,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 48043,
    planning_portal_url: "https://publicaccess.newark-sherwooddc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.newark-sherwooddc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Newcastle City Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000021",
    lpa_gss_code: "E60000009",
    pdgov_organisation: "local-authority:NET",
    pdgov_org_entity: "228",
    pdgov_lpa_entity: "626009",
    planit_area_name: "Newcastle upon Tyne",
    planit_area_id: 278,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 68897,
    planning_portal_url: "https://portal.newcastle.gov.uk/planning/index.html?fa=search",
    website: "https://www.newcastle.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Newcastle-under-Lyme Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000195",
    lpa_gss_code: "E60000120",
    pdgov_organisation: "local-authority:NEC",
    pdgov_org_entity: "224",
    pdgov_lpa_entity: "626120",
    planit_area_name: "Newcastle under Lyme",
    planit_area_id: 217,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 29693,
    planning_portal_url: "https://publicaccess.newcastle-staffs.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.newcastle-staffs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Devon District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000043",
    lpa_gss_code: "E60000303",
    pdgov_organisation: "local-authority:NDE",
    pdgov_org_entity: "221",
    pdgov_lpa_entity: "626303",
    planit_area_name: "North Devon",
    planit_area_id: 83,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 47579,
    planning_portal_url: "https://planning.northdevon.gov.uk/Search/Advanced/",
    website: "https://www.northdevon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North East Derbyshire District Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000038",
    lpa_gss_code: "E60000083",
    pdgov_organisation: "local-authority:NED",
    pdgov_org_entity: "226",
    pdgov_lpa_entity: "626083",
    planit_area_name: "North East Derbyshire",
    planit_area_id: 78,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-01",
    planit_total_apps: 29528,
    planning_portal_url: "https://planapps-online.ne-derbyshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.ne-derbyshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North East Lincolnshire Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000012",
    lpa_gss_code: "E60000054",
    pdgov_organisation: "local-authority:NEL",
    pdgov_org_entity: "227",
    pdgov_lpa_entity: "626054",
    planit_area_name: "North East Lincs",
    planit_area_id: 12,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 28888,
    planning_portal_url: "https://planninganddevelopment.nelincs.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.nelincs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Hertfordshire District Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000099",
    lpa_gss_code: "E60000170",
    pdgov_organisation: "local-authority:NHE",
    pdgov_org_entity: "232",
    pdgov_lpa_entity: "626170",
    planit_area_name: "North Hertfordshire",
    planit_area_id: 132,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 52656,
    planning_portal_url: "https://pa2.north-herts.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.north-herts.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Kesteven District Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000139",
    lpa_gss_code: "E60000095",
    pdgov_organisation: "local-authority:NKE",
    pdgov_org_entity: "233",
    pdgov_lpa_entity: "626095",
    planit_area_name: "North Kesteven",
    planit_area_id: 172,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 39292,
    planning_portal_url: "https://planningonline.n-kesteven.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.n-kesteven.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Lincolnshire Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000013",
    lpa_gss_code: "E60000055",
    pdgov_organisation: "local-authority:NLN",
    pdgov_org_entity: "234",
    pdgov_lpa_entity: "626055",
    planit_area_name: "North Lincs",
    planit_area_id: 13,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-08-07",
    planit_total_apps: 16397,
    planning_portal_url: "https://apps.northlincs.gov.uk/",
    website: "https://www.northlincs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Norfolk District Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000147",
    lpa_gss_code: "E60000180",
    pdgov_organisation: "local-authority:NNO",
    pdgov_org_entity: "235",
    pdgov_lpa_entity: "626180",
    planit_area_name: "North Norfolk",
    planit_area_id: 180,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 58187,
    planning_portal_url: "https://idoxpa.north-norfolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northnorfolk.org/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Northamptonshire Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000061",
    lpa_gss_code: "E60000332",
    pdgov_organisation: "local-authority:NNUA",
    pdgov_org_entity: "501908",
    pdgov_lpa_entity: "626332",
    planit_area_name: "North Northamptonshire",
    planit_area_id: 518,
    planit_covered: "yes",
    planit_scraper_type: "Idox Northants",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 3396,
    planning_portal_url: "https://publicaccess.northnorthants.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northnorthants.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Somerset Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000024",
    lpa_gss_code: "E60000294",
    pdgov_organisation: "local-authority:NSM",
    pdgov_org_entity: "238",
    pdgov_lpa_entity: "626294",
    planit_area_name: "North Somerset",
    planit_area_id: 24,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 66730,
    planning_portal_url: "https://planning.n-somerset.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.n-somerset.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Tyneside Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000022",
    lpa_gss_code: "E60000010",
    pdgov_organisation: "local-authority:NTY",
    pdgov_org_entity: "242",
    pdgov_lpa_entity: "626010",
    planit_area_name: "North Tyneside",
    planit_area_id: 279,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 39e3,
    planning_portal_url: "https://idoxpublicaccess.northtyneside.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northtyneside.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Warwickshire Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Warwickshire",
    type: "district",
    gss_code: "E07000218",
    lpa_gss_code: "E60000125",
    pdgov_organisation: "local-authority:NWA",
    pdgov_org_entity: "244",
    pdgov_lpa_entity: "626125",
    planit_area_name: "North Warwickshire",
    planit_area_id: 240,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 21126,
    planning_portal_url: "https://planning.northwarks.gov.uk/Search/Results/",
    website: "https://www.northwarks.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North West Leicestershire District Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000134",
    lpa_gss_code: "E60000090",
    pdgov_organisation: "local-authority:NWL",
    pdgov_org_entity: "245",
    pdgov_lpa_entity: "626090",
    planit_area_name: "North West Leicestershire",
    planit_area_id: 167,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 29480,
    planning_portal_url: "https://plans.nwleics.gov.uk/public-access/search.do?action=advanced",
    website: "https://www.nwleics.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North York Moors National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000005",
    lpa_gss_code: "E60000322",
    pdgov_organisation: "national-park-authority:Q72617669",
    pdgov_org_entity: "402",
    pdgov_lpa_entity: "626322",
    planit_area_name: "North York Moors",
    planit_area_id: 358,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 21162,
    planning_portal_url: "https://northyorkmoors-publicportal.statmap.co.uk/horizoNext/publicportal",
    website: "https://www.northyorkmoors.org.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Yorkshire Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "unitary",
    gss_code: "E06000065",
    lpa_gss_code: "E60000336",
    pdgov_organisation: "local-authority:NYUA",
    pdgov_org_entity: "10004",
    pdgov_lpa_entity: "626336",
    planit_area_name: "North Yorkshire",
    planit_area_id: 344,
    planit_covered: "yes",
    planit_scraper_type: "Idox Atrium",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 11981,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northyorks.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Northumberland County Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000057",
    lpa_gss_code: "E60000005",
    pdgov_organisation: "local-authority:NBL",
    pdgov_org_entity: "220",
    pdgov_lpa_entity: "626005",
    planit_area_name: "Northumberland (County)",
    planit_area_id: 48,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 106938,
    planning_portal_url: "https://publicaccess.northumberland.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northumberland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Northumberland National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000004",
    lpa_gss_code: "E60000323",
    pdgov_organisation: "national-park-authority:Q72617890",
    pdgov_org_entity: "404",
    pdgov_lpa_entity: "626323",
    planit_area_name: "Northumberland (Park)",
    planit_area_id: 357,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 2543,
    planning_portal_url: "https://nnpa.planning-register.co.uk/Search/Advanced/",
    website: "https://www.northumberlandnationalpark.org.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Norwich City Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000148",
    lpa_gss_code: "E60000181",
    pdgov_organisation: "local-authority:NOW",
    pdgov_org_entity: "237",
    pdgov_lpa_entity: "626181",
    planit_area_name: "Norwich",
    planit_area_id: 181,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 27704,
    planning_portal_url: "https://planning.norwich.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.norwich.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Nottingham City Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000018",
    lpa_gss_code: "E60000075",
    pdgov_organisation: "local-authority:NGM",
    pdgov_org_entity: "231",
    pdgov_lpa_entity: "626075",
    planit_area_name: "Nottingham",
    planit_area_id: 18,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 60647,
    planning_portal_url: "https://publicaccess.nottinghamcity.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.nottinghamcity.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Nuneaton and Bedworth Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Warwickshire",
    type: "district",
    gss_code: "E07000219",
    lpa_gss_code: "E60000126",
    pdgov_organisation: "local-authority:NUN",
    pdgov_org_entity: "243",
    pdgov_lpa_entity: "626126",
    planit_area_name: "Nuneaton",
    planit_area_id: 241,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2019-10-15",
    planit_total_apps: 14465,
    planning_portal_url: "http://apps.nuneatonandbedworth.gov.uk/bt_nbbc_planning/bt_nbbc_planning_disp.asp",
    website: "https://www.nuneatonandbedworth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2019-10-15)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Oadby and Wigston Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Leicestershire",
    type: "district",
    gss_code: "E07000135",
    lpa_gss_code: "E60000091",
    pdgov_organisation: "local-authority:OAD",
    pdgov_org_entity: "248",
    pdgov_lpa_entity: "626091",
    planit_area_name: "Oadby and Wigston",
    planit_area_id: 168,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 11951,
    planning_portal_url: "https://pa.oadby-wigston.gov.uk/online-applications/search.do?action=advanced",
    website: "https://oadby-wigston.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Old Oak and Park Royal Development Corporation",
    nation: "England",
    region: "",
    county: "",
    type: "development corporation",
    gss_code: "E51000002",
    lpa_gss_code: "E60000330",
    pdgov_organisation: "development-corporation:Q20648596",
    pdgov_org_entity: "1",
    pdgov_lpa_entity: "626330",
    planit_area_name: "Old Oak Park Royal",
    planit_area_id: 514,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 2165,
    planning_portal_url: "https://planning.agileapplications.co.uk/opdc/search-applications/",
    website: "https://www.london.gov.uk/about-us/organisations-we-work/old-oak-and-park-royal-development-corporation-opdc",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Oldham Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000004",
    lpa_gss_code: "E60000028",
    pdgov_organisation: "local-authority:OLD",
    pdgov_org_entity: "249",
    pdgov_lpa_entity: "626028",
    planit_area_name: "Oldham",
    planit_area_id: 261,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 43767,
    planning_portal_url: "https://planningpa.oldham.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.oldham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Oxford City Council",
    nation: "England",
    region: "South East",
    county: "Oxfordshire",
    type: "district",
    gss_code: "E07000178",
    lpa_gss_code: "E60000266",
    pdgov_organisation: "local-authority:OXO",
    pdgov_org_entity: "251",
    pdgov_lpa_entity: "626266",
    planit_area_name: "Oxford",
    planit_area_id: 205,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 67807,
    planning_portal_url: "https://public.oxford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.oxford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Peak District National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000006",
    lpa_gss_code: "E60000324",
    pdgov_organisation: "national-park-authority:Q72617988",
    pdgov_org_entity: "405",
    pdgov_lpa_entity: "626324",
    planit_area_name: "Peak District",
    planit_area_id: 359,
    planit_covered: "yes",
    planit_scraper_type: "EnterpriseStore",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 31070,
    planning_portal_url: "https://planning.peakdistrict.gov.uk/AssureLive/ES/Presentation/Planning/OnlinePlanning/OnlinePlanningSearch",
    website: "https://www.peakdistrict.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Pendle Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000122",
    lpa_gss_code: "E60000040",
    pdgov_organisation: "local-authority:PEN",
    pdgov_org_entity: "252",
    pdgov_lpa_entity: "626040",
    planit_area_name: "Pendle",
    planit_area_id: 155,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 19228,
    planning_portal_url: "https://publicaccess.pendle.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.pendle.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Peterborough City Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000031",
    lpa_gss_code: "E60000146",
    pdgov_organisation: "local-authority:PTE",
    pdgov_org_entity: "257",
    pdgov_lpa_entity: "626146",
    planit_area_name: "Peterborough",
    planit_area_id: 31,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 46821,
    planning_portal_url: "https://planning.agileapplications.co.uk/peterborough/search-applications/",
    website: "https://www.peterborough.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Plymouth City Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000026",
    lpa_gss_code: "E60000295",
    pdgov_organisation: "local-authority:PLY",
    pdgov_org_entity: "253",
    pdgov_lpa_entity: "626295",
    planit_area_name: "Plymouth",
    planit_area_id: 26,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 44344,
    planning_portal_url: "https://planning.plymouth.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.plymouth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Portsmouth City Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000044",
    lpa_gss_code: "E60000226",
    pdgov_organisation: "local-authority:POR",
    pdgov_org_entity: "255",
    pdgov_lpa_entity: "626226",
    planit_area_name: "Portsmouth",
    planit_area_id: 44,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-04-17",
    planit_total_apps: 31386,
    planning_portal_url: "https://publicaccess.portsmouth.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.portsmouth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-04-17)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Preston City Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000123",
    lpa_gss_code: "E60000041",
    pdgov_organisation: "local-authority:PRE",
    pdgov_org_entity: "256",
    pdgov_lpa_entity: "626041",
    planit_area_name: "Preston",
    planit_area_id: 156,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-07-29",
    planit_total_apps: 31603,
    planning_portal_url: "https://selfservice.preston.gov.uk/service/planning/ApplicationSearch.aspx",
    website: "https://www.preston.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-29)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Reading Borough Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000038",
    lpa_gss_code: "E60000227",
    pdgov_organisation: "local-authority:RDG",
    pdgov_org_entity: "262",
    pdgov_lpa_entity: "626227",
    planit_area_name: "Reading",
    planit_area_id: 38,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 80800,
    planning_portal_url: "https://publicregister.reading.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "http://www.reading.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Redcar and Cleveland Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000003",
    lpa_gss_code: "E60000006",
    pdgov_organisation: "local-authority:RCC",
    pdgov_org_entity: "259",
    pdgov_lpa_entity: "626006",
    planit_area_name: "Redcar and Cleveland",
    planit_area_id: 3,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 25797,
    planning_portal_url: "https://planning.redcar-cleveland.gov.uk/Search/Planning/Advanced/",
    website: "https://www.redcar-cleveland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Redditch Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000236",
    lpa_gss_code: "E60000139",
    pdgov_organisation: "local-authority:RED",
    pdgov_org_entity: "263",
    pdgov_lpa_entity: "626139",
    planit_area_name: "Redditch",
    planit_area_id: 254,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://publicaccess.bromsgroveandredditch.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.redditchbc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Bromsgrove Redditch' (id 512, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Reigate and Banstead Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000211",
    lpa_gss_code: "E60000274",
    pdgov_organisation: "local-authority:REI",
    pdgov_org_entity: "264",
    pdgov_lpa_entity: "626274",
    planit_area_name: "Reigate",
    planit_area_id: 233,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 68799,
    planning_portal_url: "https://planning.reigate-banstead.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.reigate-banstead.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ribble Valley Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000124",
    lpa_gss_code: "E60000042",
    pdgov_organisation: "local-authority:RIB",
    pdgov_org_entity: "265",
    pdgov_lpa_entity: "626042",
    planit_area_name: "Ribble Valley",
    planit_area_id: 157,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-01",
    planit_total_apps: 38846,
    planning_portal_url: "https://webportal.ribblevalley.gov.uk/planningApplication/search/advanced",
    website: "https://www.ribblevalley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rochdale Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000005",
    lpa_gss_code: "E60000029",
    pdgov_organisation: "local-authority:RCH",
    pdgov_org_entity: "260",
    pdgov_lpa_entity: "626029",
    planit_area_name: "Rochdale",
    planit_area_id: 262,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 40024,
    planning_portal_url: "https://account.rochdale.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register&c__q",
    website: "https://www.rochdale.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rochford District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000075",
    lpa_gss_code: "E60000163",
    pdgov_organisation: "local-authority:ROC",
    pdgov_org_entity: "268",
    pdgov_lpa_entity: "626163",
    planit_area_name: "Rochford",
    planit_area_id: 108,
    planit_covered: "yes",
    planit_scraper_type: "Astun",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 25643,
    planning_portal_url: "https://maps.rochford.gov.uk/DevelopmentControl.aspx?RequestType=ParseTemplate&template=DevelopmentControlAdvancedSearch.tmplt",
    website: "https://www.rochford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rossendale Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000125",
    lpa_gss_code: "E60000043",
    pdgov_organisation: "local-authority:ROS",
    pdgov_org_entity: "270",
    pdgov_lpa_entity: "626043",
    planit_area_name: "Rossendale",
    planit_area_id: 158,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 15007,
    planning_portal_url: "https://publicaccess.rossendale.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rossendale.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rother District Council",
    nation: "England",
    region: "South East",
    county: "East Sussex",
    type: "district",
    gss_code: "E07000064",
    lpa_gss_code: "E60000240",
    pdgov_organisation: "local-authority:ROH",
    pdgov_org_entity: "269",
    pdgov_lpa_entity: "626240",
    planit_area_name: "Rother",
    planit_area_id: 97,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-06",
    planit_total_apps: 48288,
    planning_portal_url: "https://online.rother.gov.uk/planning/index.html?fa=search",
    website: "https://www.rother.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-06)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rotherham Metropolitan Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000018",
    lpa_gss_code: "E60000066",
    pdgov_organisation: "local-authority:ROT",
    pdgov_org_entity: "271",
    pdgov_lpa_entity: "626066",
    planit_area_name: "Rotherham",
    planit_area_id: 275,
    planit_covered: "yes",
    planit_scraper_type: "Fastweb",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 48667,
    planning_portal_url: "https://planning.rotherham.gov.uk/fastweblive/search.asp",
    website: "https://www.rotherham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Royal Borough of Greenwich",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000011",
    lpa_gss_code: "E60000210",
    pdgov_organisation: "local-authority:GRE",
    pdgov_org_entity: "150",
    pdgov_lpa_entity: "626210",
    planit_area_name: "Greenwich",
    planit_area_id: 304,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 83203,
    planning_portal_url: "https://planning.royalgreenwich.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.royalgreenwich.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Royal Borough of Kensington and Chelsea",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000020",
    lpa_gss_code: "E60000194",
    pdgov_organisation: "local-authority:KEC",
    pdgov_org_entity: "182",
    pdgov_lpa_entity: "626194",
    planit_area_name: "Kensington",
    planit_area_id: 313,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-07-27",
    planit_total_apps: 134660,
    planning_portal_url: "https://www.rbkc.gov.uk/planningsearch",
    website: "https://www.rbkc.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-27)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Royal Borough of Kingston upon Thames",
    nation: "England",
    region: "London",
    county: "",
    type: "london borough",
    gss_code: "E09000021",
    lpa_gss_code: "E60000215",
    pdgov_organisation: "local-authority:KTT",
    pdgov_org_entity: "188",
    pdgov_lpa_entity: "626215",
    planit_area_name: "Kingston",
    planit_area_id: 314,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 128037,
    planning_portal_url: "https://publicaccess.kingston.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.kingston.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Royal Borough of Windsor and Maidenhead",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000040",
    lpa_gss_code: "E60000231",
    pdgov_organisation: "local-authority:WNM",
    pdgov_org_entity: "377",
    pdgov_lpa_entity: "626231",
    planit_area_name: "Windsor",
    planit_area_id: 40,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 86426,
    planning_portal_url: "https://publicaccess.rbwm.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rbwm.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rugby Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Warwickshire",
    type: "district",
    gss_code: "E07000220",
    lpa_gss_code: "E60000127",
    pdgov_organisation: "local-authority:RUG",
    pdgov_org_entity: "272",
    pdgov_lpa_entity: "626127",
    planit_area_name: "Rugby",
    planit_area_id: 242,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 32013,
    planning_portal_url: "https://planning.agileapplications.co.uk/rugby/search-applications/",
    website: "https://www.rugby.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Runnymede Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000212",
    lpa_gss_code: "E60000275",
    pdgov_organisation: "local-authority:RUN",
    pdgov_org_entity: "274",
    pdgov_lpa_entity: "626275",
    planit_area_name: "Runnymede",
    planit_area_id: 234,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 39316,
    planning_portal_url: "https://planning.runnymede.gov.uk/Northgate/PlanningExplorer/GeneralSearch.aspx",
    website: "https://www.runnymede.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rushcliffe Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "Nottinghamshire",
    type: "district",
    gss_code: "E07000176",
    lpa_gss_code: "E60000112",
    pdgov_organisation: "local-authority:RUS",
    pdgov_org_entity: "275",
    pdgov_lpa_entity: "626112",
    planit_area_name: "Rushcliffe",
    planit_area_id: 203,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 40215,
    planning_portal_url: "https://planningon-line.rushcliffe.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rushcliffe.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rushmoor Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000092",
    lpa_gss_code: "E60000250",
    pdgov_organisation: "local-authority:RUH",
    pdgov_org_entity: "273",
    pdgov_lpa_entity: "626250",
    planit_area_name: "Rushmoor",
    planit_area_id: 125,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 22217,
    planning_portal_url: "https://publicaccess.rushmoor.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rushmoor.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rutland County Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000017",
    lpa_gss_code: "E60000076",
    pdgov_organisation: "local-authority:RUT",
    pdgov_org_entity: "276",
    pdgov_lpa_entity: "626076",
    planit_area_name: "Rutland",
    planit_area_id: 17,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 29847,
    planning_portal_url: "https://publicaccess.rutland.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rutland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Salford City Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000006",
    lpa_gss_code: "E60000030",
    pdgov_organisation: "local-authority:SLF",
    pdgov_org_entity: "301",
    pdgov_lpa_entity: "626030",
    planit_area_name: "Salford",
    planit_area_id: 263,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 43185,
    planning_portal_url: "https://salfordcitycouncil.my.site.com/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.salford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sandwell Metropolitan Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000028",
    lpa_gss_code: "E60000133",
    pdgov_organisation: "local-authority:SAW",
    pdgov_org_entity: "279",
    pdgov_lpa_entity: "626133",
    planit_area_name: "Sandwell",
    planit_area_id: 285,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 37206,
    planning_portal_url: "https://webcaps.sandwell.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.sandwell.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sefton Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000014",
    lpa_gss_code: "E60000049",
    pdgov_organisation: "local-authority:SFT",
    pdgov_org_entity: "290",
    pdgov_lpa_entity: "626049",
    planit_area_name: "Sefton",
    planit_area_id: 271,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 53429,
    planning_portal_url: "https://pa.sefton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sefton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sevenoaks District Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000111",
    lpa_gss_code: "E60000260",
    pdgov_organisation: "local-authority:SEV",
    pdgov_org_entity: "288",
    pdgov_lpa_entity: "626260",
    planit_area_name: "Sevenoaks",
    planit_area_id: 144,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 81391,
    planning_portal_url: "https://pa.sevenoaks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sevenoaks.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sheffield City Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000019",
    lpa_gss_code: "E60000067",
    pdgov_organisation: "local-authority:SHF",
    pdgov_org_entity: "294",
    pdgov_lpa_entity: "626067",
    planit_area_name: "Sheffield",
    planit_area_id: 276,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 96187,
    planning_portal_url: "https://planningapps.sheffield.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sheffield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Shropshire Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000051",
    lpa_gss_code: "E60000114",
    pdgov_organisation: "local-authority:SHR",
    pdgov_org_entity: "297",
    pdgov_lpa_entity: "626114",
    planit_area_name: "Shropshire",
    planit_area_id: 51,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 124069,
    planning_portal_url: "https://pa.shropshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.shropshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Slough Borough Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000039",
    lpa_gss_code: "E60000228",
    pdgov_organisation: "local-authority:SLG",
    pdgov_org_entity: "302",
    pdgov_lpa_entity: "626228",
    planit_area_name: "Slough",
    planit_area_id: 39,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 35338,
    planning_portal_url: "https://planning.agileapplications.co.uk/slough/search-applications/",
    website: "https://www.slough.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Solihull Metropolitan Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000029",
    lpa_gss_code: "E60000134",
    pdgov_organisation: "local-authority:SOL",
    pdgov_org_entity: "306",
    pdgov_lpa_entity: "626134",
    planit_area_name: "Solihull",
    planit_area_id: 286,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 67582,
    planning_portal_url: "https://publicaccess.solihull.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.solihull.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Somerset Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000066",
    lpa_gss_code: "E60000337",
    pdgov_organisation: "local-authority:SUA",
    pdgov_org_entity: "10003",
    pdgov_lpa_entity: "626337",
    planit_area_name: "Somerset",
    planit_area_id: 347,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 4457,
    planning_portal_url: "https://planning.somerset.gov.uk/Search/Advanced/",
    website: "https://www.somerset.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Cambridgeshire District Council",
    nation: "England",
    region: "East of England",
    county: "Cambridgeshire",
    type: "district",
    gss_code: "E07000012",
    lpa_gss_code: "E60000153",
    pdgov_organisation: "local-authority:SCA",
    pdgov_org_entity: "281",
    pdgov_lpa_entity: "626153",
    planit_area_name: "South Cambridgeshire",
    planit_area_id: 65,
    planit_covered: "yes",
    planit_scraper_type: "Idox Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 75268,
    planning_portal_url: "https://applications.greatercambridgeplanning.org/online-applications/search.do?action=advanced",
    website: "https://www.scambs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Derbyshire District Council",
    nation: "England",
    region: "East Midlands",
    county: "Derbyshire",
    type: "district",
    gss_code: "E07000039",
    lpa_gss_code: "E60000084",
    pdgov_organisation: "local-authority:SDE",
    pdgov_org_entity: "284",
    pdgov_lpa_entity: "626084",
    planit_area_name: "South Derbyshire",
    planit_area_id: 79,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-12",
    planit_total_apps: 33090,
    planning_portal_url: "https://planning.southderbyshire.gov.uk/",
    website: "https://www.southderbyshire.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Downs National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000010",
    lpa_gss_code: "E60000325",
    pdgov_organisation: "national-park-authority:Q20198711",
    pdgov_org_entity: "396",
    pdgov_lpa_entity: "626325",
    planit_area_name: "South Downs",
    planit_area_id: 363,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 70023,
    planning_portal_url: "https://planningpublicaccess.southdowns.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southdowns.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Gloucestershire Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000025",
    lpa_gss_code: "E60000296",
    pdgov_organisation: "local-authority:SGC",
    pdgov_org_entity: "291",
    pdgov_lpa_entity: "626296",
    planit_area_name: "South Gloucestershire",
    planit_area_id: 25,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 78461,
    planning_portal_url: "https://developments.southglos.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southglos.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Hams District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000044",
    lpa_gss_code: "E60000304",
    pdgov_organisation: "local-authority:SHA",
    pdgov_org_entity: "292",
    pdgov_lpa_entity: "626304",
    planit_area_name: "South Hams",
    planit_area_id: 84,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.southhams.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'South West Devon' (id 510, Atrium)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "South Holland District Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000140",
    lpa_gss_code: "E60000096",
    pdgov_organisation: "local-authority:SHO",
    pdgov_org_entity: "296",
    pdgov_lpa_entity: "626096",
    planit_area_name: "South Holland",
    planit_area_id: 173,
    planit_covered: "yes",
    planit_scraper_type: "Ocella",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 34264,
    planning_portal_url: "https://planning.sholland.gov.uk/OcellaWeb/planningSearch",
    website: "https://www.sholland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Kesteven District Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000141",
    lpa_gss_code: "E60000097",
    pdgov_organisation: "local-authority:SKE",
    pdgov_org_entity: "298",
    pdgov_lpa_entity: "626097",
    planit_area_name: "South Kesteven",
    planit_area_id: 174,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-20",
    planit_total_apps: 96390,
    planning_portal_url: "https://prod.publicaccess.southkesteven.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southkesteven.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Norfolk District Council",
    nation: "England",
    region: "East of England",
    county: "Norfolk",
    type: "district",
    gss_code: "E07000149",
    lpa_gss_code: "E60000182",
    pdgov_organisation: "local-authority:SNO",
    pdgov_org_entity: "304",
    pdgov_lpa_entity: "626182",
    planit_area_name: "South Norfolk",
    planit_area_id: 182,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.south-norfolk.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'South Norfolk Broadland' (id 521, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "South Oxfordshire District Council",
    nation: "England",
    region: "South East",
    county: "Oxfordshire",
    type: "district",
    gss_code: "E07000179",
    lpa_gss_code: "E60000267",
    pdgov_organisation: "local-authority:SOX",
    pdgov_org_entity: "309",
    pdgov_lpa_entity: "626267",
    planit_area_name: "South Oxfordshire",
    planit_area_id: 206,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 86584,
    planning_portal_url: "https://southoxfordshire.planning-register.co.uk/Search/Results",
    website: "https://www.southoxon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Ribble Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000126",
    lpa_gss_code: "E60000044",
    pdgov_organisation: "local-authority:SRI",
    pdgov_org_entity: "311",
    pdgov_lpa_entity: "626044",
    planit_area_name: "South Ribble",
    planit_area_id: 159,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 22730,
    planning_portal_url: "https://publicaccess.southribble.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southribble.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Staffordshire Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000196",
    lpa_gss_code: "E60000121",
    pdgov_organisation: "local-authority:SST",
    pdgov_org_entity: "314",
    pdgov_lpa_entity: "626121",
    planit_area_name: "South Staffordshire",
    planit_area_id: 218,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 29557,
    planning_portal_url: "https://planning.sstaffs.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sstaffs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Tyneside Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000023",
    lpa_gss_code: "E60000011",
    pdgov_organisation: "local-authority:STY",
    pdgov_org_entity: "325",
    pdgov_lpa_entity: "626011",
    planit_area_name: "South Tyneside",
    planit_area_id: 280,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 29354,
    planning_portal_url: "https://planning.southtyneside.info/Northgate/PlanningExplorer/GeneralSearch.aspx",
    website: "https://www.southtyneside.info",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Southampton City Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000045",
    lpa_gss_code: "E60000229",
    pdgov_organisation: "local-authority:STH",
    pdgov_org_entity: "318",
    pdgov_lpa_entity: "626229",
    planit_area_name: "Southampton",
    planit_area_id: 45,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 42719,
    planning_portal_url: "https://planningpublicaccess.southampton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southampton.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Southend-on-Sea Borough Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000033",
    lpa_gss_code: "E60000147",
    pdgov_organisation: "local-authority:SOS",
    pdgov_org_entity: "308",
    pdgov_lpa_entity: "626147",
    planit_area_name: "Southend",
    planit_area_id: 33,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 42416,
    planning_portal_url: "https://publicaccess.southend.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southend.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Spelthorne Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000213",
    lpa_gss_code: "E60000276",
    pdgov_organisation: "local-authority:SPE",
    pdgov_org_entity: "310",
    pdgov_lpa_entity: "626276",
    planit_area_name: "Spelthorne",
    planit_area_id: 235,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 31997,
    planning_portal_url: "https://publicaccess.spelthorne.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.spelthorne.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "St Albans City and District Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000240",
    lpa_gss_code: "E60000171",
    pdgov_organisation: "local-authority:SAL",
    pdgov_org_entity: "278",
    pdgov_lpa_entity: "626171",
    planit_area_name: "St Albans",
    planit_area_id: 133,
    planit_covered: "yes",
    planit_scraper_type: "CivicaJson",
    planit_latest_app_date: "2026-10-05",
    planit_total_apps: 88037,
    planning_portal_url: "https://planningapplications.stalbans.gov.uk/planning/search-applications",
    website: "https://www.stalbans.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "St Helens Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000013",
    lpa_gss_code: "E60000050",
    pdgov_organisation: "local-authority:SHN",
    pdgov_org_entity: "295",
    pdgov_lpa_entity: "626050",
    planit_area_name: "St Helens",
    planit_area_id: 270,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 34373,
    planning_portal_url: "https://publicaccess.sthelens.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sthelens.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stafford Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000197",
    lpa_gss_code: "E60000122",
    pdgov_organisation: "local-authority:STA",
    pdgov_org_entity: "315",
    pdgov_lpa_entity: "626122",
    planit_area_name: "Stafford",
    planit_area_id: 219,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 33639,
    planning_portal_url: "https://www12.staffordbc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.staffordbc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Staffordshire Moorlands District Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000198",
    lpa_gss_code: "E60000123",
    pdgov_organisation: "local-authority:STF",
    pdgov_org_entity: "317",
    pdgov_lpa_entity: "626123",
    planit_area_name: "Staffordshire Moorlands",
    planit_area_id: 220,
    planit_covered: "yes",
    planit_scraper_type: "AppSearchServ",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 30756,
    planning_portal_url: "http://publicaccess.staffsmoorlands.gov.uk/portal/servlets/ApplicationSearchServlet",
    website: "https://www.staffsmoorlands.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stevenage Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000243",
    lpa_gss_code: "E60000172",
    pdgov_organisation: "local-authority:STV",
    pdgov_org_entity: "324",
    pdgov_lpa_entity: "626172",
    planit_area_name: "Stevenage",
    planit_area_id: 134,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 15833,
    planning_portal_url: "https://publicaccess.stevenage.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.stevenage.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stockport Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000007",
    lpa_gss_code: "E60000031",
    pdgov_organisation: "local-authority:SKP",
    pdgov_org_entity: "299",
    pdgov_lpa_entity: "626031",
    planit_area_name: "Stockport",
    planit_area_id: 264,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 85152,
    planning_portal_url: "https://planning.stockport.gov.uk/PlanningData-live/search.do?action=advanced",
    website: "https://www.stockport.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stockton-on-Tees Borough Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "unitary",
    gss_code: "E06000004",
    lpa_gss_code: "E60000007",
    pdgov_organisation: "local-authority:STT",
    pdgov_org_entity: "323",
    pdgov_lpa_entity: "626007",
    planit_area_name: "Stockton-on-Tees",
    planit_area_id: 4,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 36697,
    planning_portal_url: "https://www.developmentmanagement.stockton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.stockton.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stoke-on-Trent City Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000021",
    lpa_gss_code: "E60000115",
    pdgov_organisation: "local-authority:STE",
    pdgov_org_entity: "316",
    pdgov_lpa_entity: "626115",
    planit_area_name: "Stoke on Trent",
    planit_area_id: 21,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-06-23",
    planit_total_apps: 30261,
    planning_portal_url: "https://development.stoke.gov.uk/planning/index.html?fa=search",
    website: "https://www.stoke.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-06-23)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stratford-on-Avon District Council",
    nation: "England",
    region: "West Midlands",
    county: "Warwickshire",
    type: "district",
    gss_code: "E07000221",
    lpa_gss_code: "E60000128",
    pdgov_organisation: "local-authority:STR",
    pdgov_org_entity: "321",
    pdgov_lpa_entity: "626128",
    planit_area_name: "Stratford on Avon",
    planit_area_id: 243,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-25",
    planit_total_apps: 83664,
    planning_portal_url: "https://apps.stratford.gov.uk/EplanningV2/",
    website: "https://www.stratford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stroud District Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000082",
    lpa_gss_code: "E60000312",
    pdgov_organisation: "local-authority:STO",
    pdgov_org_entity: "320",
    pdgov_lpa_entity: "626312",
    planit_area_name: "Stroud",
    planit_area_id: 115,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 59173,
    planning_portal_url: "https://publicaccess.stroud.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.stroud.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sunderland City Council",
    nation: "England",
    region: "North East",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000024",
    lpa_gss_code: "E60000012",
    pdgov_organisation: "local-authority:SND",
    pdgov_org_entity: "303",
    pdgov_lpa_entity: "626012",
    planit_area_name: "Sunderland",
    planit_area_id: 281,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 42444,
    planning_portal_url: "https://online-applications.sunderland.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.sunderland.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Surrey Heath Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000214",
    lpa_gss_code: "E60000277",
    pdgov_organisation: "local-authority:SUR",
    pdgov_org_entity: "327",
    pdgov_lpa_entity: "626277",
    planit_area_name: "Surrey Heath",
    planit_area_id: 236,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 37634,
    planning_portal_url: "https://publicaccess.surreyheath.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.surreyheath.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Swale Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000113",
    lpa_gss_code: "E60000261",
    pdgov_organisation: "local-authority:SWL",
    pdgov_org_entity: "330",
    pdgov_lpa_entity: "626261",
    planit_area_name: "Swale",
    planit_area_id: 146,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://pa.midkent.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.swale.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Mid Kent' (id 508, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Swindon Borough Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000030",
    lpa_gss_code: "E60000297",
    pdgov_organisation: "local-authority:SWD",
    pdgov_org_entity: "328",
    pdgov_lpa_entity: "626297",
    planit_area_name: "Swindon",
    planit_area_id: 30,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 48035,
    planning_portal_url: "https://pa.swindon.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.swindon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tameside Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000008",
    lpa_gss_code: "E60000032",
    pdgov_organisation: "local-authority:TAM",
    pdgov_org_entity: "332",
    pdgov_lpa_entity: "626032",
    planit_area_name: "Tameside",
    planit_area_id: 265,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 32390,
    planning_portal_url: "https://publicaccess.tameside.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.tameside.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tamworth Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "Staffordshire",
    type: "district",
    gss_code: "E07000199",
    lpa_gss_code: "E60000124",
    pdgov_organisation: "local-authority:TAW",
    pdgov_org_entity: "335",
    pdgov_lpa_entity: "626124",
    planit_area_name: "Tamworth",
    planit_area_id: 221,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 13917,
    planning_portal_url: "https://planning.tamworth.gov.uk/Northgate/PlanningExplorerAA/GeneralSearch.aspx",
    website: "https://www.tamworth.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tandridge District Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000215",
    lpa_gss_code: "E60000278",
    pdgov_organisation: "local-authority:TAN",
    pdgov_org_entity: "333",
    pdgov_lpa_entity: "626278",
    planit_area_name: "Tandridge",
    planit_area_id: 237,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 47871,
    planning_portal_url: "https://tdcplanningsearch.tandridge.gov.uk/",
    website: "https://www.tandridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Teignbridge District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000045",
    lpa_gss_code: "E60000305",
    pdgov_organisation: "local-authority:TEI",
    pdgov_org_entity: "336",
    pdgov_lpa_entity: "626305",
    planit_area_name: "Teignbridge",
    planit_area_id: 85,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 54344,
    planning_portal_url: "https://publicaccess.teignbridge.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.teignbridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Telford & Wrekin Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000020",
    lpa_gss_code: "E60000116",
    pdgov_organisation: "local-authority:TFW",
    pdgov_org_entity: "340",
    pdgov_lpa_entity: "626116",
    planit_area_name: "Telford",
    planit_area_id: 20,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 45201,
    planning_portal_url: "https://secure.telford.gov.uk/planning/search-all.aspx",
    website: "https://www.telford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tendring District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000076",
    lpa_gss_code: "E60000164",
    pdgov_organisation: "local-authority:TEN",
    pdgov_org_entity: "337",
    pdgov_lpa_entity: "626164",
    planit_area_name: "Tendring",
    planit_area_id: 109,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 45778,
    planning_portal_url: "https://idox.tendringdc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.tendringdc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Test Valley Borough Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000093",
    lpa_gss_code: "E60000251",
    pdgov_organisation: "local-authority:TES",
    pdgov_org_entity: "338",
    pdgov_lpa_entity: "626251",
    planit_area_name: "Test Valley",
    planit_area_id: 126,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 59033,
    planning_portal_url: "https://view-applications.testvalley.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.testvalley.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tewkesbury Borough Council",
    nation: "England",
    region: "South West",
    county: "Gloucestershire",
    type: "district",
    gss_code: "E07000083",
    lpa_gss_code: "E60000313",
    pdgov_organisation: "local-authority:TEW",
    pdgov_org_entity: "339",
    pdgov_lpa_entity: "626313",
    planit_area_name: "Tewkesbury",
    planit_area_id: 116,
    planit_covered: "yes",
    planit_scraper_type: "Idox IdoxPeriod",
    planit_latest_app_date: "2026-09-28",
    planit_total_apps: 34108,
    planning_portal_url: "https://publicaccess.tewkesbury.gov.uk/online-applications/search.do?action=advanced",
    website: "https://tewkesbury.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Thanet District Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000114",
    lpa_gss_code: "E60000262",
    pdgov_organisation: "local-authority:THA",
    pdgov_org_entity: "341",
    pdgov_lpa_entity: "626262",
    planit_area_name: "Thanet",
    planit_area_id: 147,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-31",
    planit_total_apps: 36287,
    planning_portal_url: "https://planning.thanet.gov.uk/online-applications/search.do?action=advanced",
    website: "https://thanet.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-07-31)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Three Rivers District Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000102",
    lpa_gss_code: "E60000173",
    pdgov_organisation: "local-authority:THE",
    pdgov_org_entity: "342",
    pdgov_lpa_entity: "626173",
    planit_area_name: "Three Rivers",
    planit_area_id: 135,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 48339,
    planning_portal_url: "https://www3.threerivers.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.threerivers.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Thurrock Council",
    nation: "England",
    region: "East of England",
    county: "",
    type: "unitary",
    gss_code: "E06000034",
    lpa_gss_code: "E60000148",
    pdgov_organisation: "local-authority:THR",
    pdgov_org_entity: "343",
    pdgov_lpa_entity: "626148",
    planit_area_name: "Thurrock",
    planit_area_id: 34,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 33189,
    planning_portal_url: "https://regs.thurrock.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.thurrock.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tonbridge and Malling Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000115",
    lpa_gss_code: "E60000263",
    pdgov_organisation: "local-authority:TON",
    pdgov_org_entity: "345",
    pdgov_lpa_entity: "626263",
    planit_area_name: "Tonbridge",
    planit_area_id: 148,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 63958,
    planning_portal_url: "https://publicaccess.tmbc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.tmbc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Torbay Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000027",
    lpa_gss_code: "E60000298",
    pdgov_organisation: "local-authority:TOB",
    pdgov_org_entity: "344",
    pdgov_lpa_entity: "626298",
    planit_area_name: "Torbay",
    planit_area_id: 27,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 39711,
    planning_portal_url: "https://publicaccess.torbay.gov.uk/view/search.do?action=advanced",
    website: "https://www.torbay.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Torridge District Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000046",
    lpa_gss_code: "E60000306",
    pdgov_organisation: "local-authority:TOR",
    pdgov_org_entity: "346",
    pdgov_lpa_entity: "626306",
    planit_area_name: "Torridge",
    planit_area_id: 86,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-07",
    planit_total_apps: 31283,
    planning_portal_url: "https://publicaccess.torridge.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.torridge.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Trafford Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000009",
    lpa_gss_code: "E60000033",
    pdgov_organisation: "local-authority:TRF",
    pdgov_org_entity: "347",
    pdgov_lpa_entity: "626033",
    planit_area_name: "Trafford",
    planit_area_id: 266,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 68092,
    planning_portal_url: "https://publicaccess.trafford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.trafford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Tunbridge Wells Borough Council",
    nation: "England",
    region: "South East",
    county: "Kent",
    type: "district",
    gss_code: "E07000116",
    lpa_gss_code: "E60000264",
    pdgov_organisation: "local-authority:TUN",
    pdgov_org_entity: "348",
    pdgov_lpa_entity: "626264",
    planit_area_name: "Tunbridge Wells",
    planit_area_id: 149,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 80591,
    planning_portal_url: "https://twbcpa.midkent.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.tunbridgewells.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Uttlesford District Council",
    nation: "England",
    region: "East of England",
    county: "Essex",
    type: "district",
    gss_code: "E07000077",
    lpa_gss_code: "E60000165",
    pdgov_organisation: "local-authority:UTT",
    pdgov_org_entity: "351",
    pdgov_lpa_entity: "626165",
    planit_area_name: "Uttlesford",
    planit_area_id: 110,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 61889,
    planning_portal_url: "https://publicaccess.uttlesford.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.uttlesford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Vale of White Horse District Council",
    nation: "England",
    region: "South East",
    county: "Oxfordshire",
    type: "district",
    gss_code: "E07000180",
    lpa_gss_code: "E60000268",
    pdgov_organisation: "local-authority:VAL",
    pdgov_org_entity: "352",
    pdgov_lpa_entity: "626268",
    planit_area_name: "Vale of White Horse",
    planit_area_id: 207,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 56767,
    planning_portal_url: "https://valeofwhitehorse.planning-register.co.uk/Search/Results",
    website: "https://www.whitehorsedc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wakefield Metropolitan District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000036",
    lpa_gss_code: "E60000072",
    pdgov_organisation: "local-authority:WKF",
    pdgov_org_entity: "370",
    pdgov_lpa_entity: "626072",
    planit_area_name: "Wakefield",
    planit_area_id: 293,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 70453,
    planning_portal_url: "https://planning.wakefield.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.wakefield.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Walsall Metropolitan Borough Council",
    nation: "England",
    region: "West Midlands",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000030",
    lpa_gss_code: "E60000135",
    pdgov_organisation: "local-authority:WLL",
    pdgov_org_entity: "373",
    pdgov_lpa_entity: "626135",
    planit_area_name: "Walsall",
    planit_area_id: 287,
    planit_covered: "yes",
    planit_scraper_type: "SwiftLG",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 48885,
    planning_portal_url: "https://planning.walsall.gov.uk/swift/apas/run/wphappcriteria.display",
    website: "https://www.walsall.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Warrington Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000007",
    lpa_gss_code: "E60000018",
    pdgov_organisation: "local-authority:WRT",
    pdgov_org_entity: "385",
    pdgov_lpa_entity: "626018",
    planit_area_name: "Warrington",
    planit_area_id: 7,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-06-30",
    planit_total_apps: 63910,
    planning_portal_url: "https://online.warrington.gov.uk/planning/index.html?fa=search",
    website: "https://www.warrington.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-06-30)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Warwick District Council",
    nation: "England",
    region: "West Midlands",
    county: "Warwickshire",
    type: "district",
    gss_code: "E07000222",
    lpa_gss_code: "E60000129",
    pdgov_organisation: "local-authority:WAW",
    pdgov_org_entity: "357",
    pdgov_lpa_entity: "626129",
    planit_area_name: "Warwick",
    planit_area_id: 244,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 46702,
    planning_portal_url: "https://planningdocuments.warwickdc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.warwickdc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Watford Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000103",
    lpa_gss_code: "E60000174",
    pdgov_organisation: "local-authority:WAT",
    pdgov_org_entity: "355",
    pdgov_lpa_entity: "626174",
    planit_area_name: "Watford",
    planit_area_id: 136,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 30512,
    planning_portal_url: "https://pa.watford.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.watford.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Waverley Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000216",
    lpa_gss_code: "E60000279",
    pdgov_organisation: "local-authority:WAE",
    pdgov_org_entity: "353",
    pdgov_lpa_entity: "626279",
    planit_area_name: "Waverley",
    planit_area_id: 238,
    planit_covered: "yes",
    planit_scraper_type: "CivicaJson",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 72405,
    planning_portal_url: "https://planning360.waverley.gov.uk:4443/planning/search-applications",
    website: "https://www.waverley.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wealden District Council",
    nation: "England",
    region: "South East",
    county: "East Sussex",
    type: "district",
    gss_code: "E07000065",
    lpa_gss_code: "E60000241",
    pdgov_organisation: "local-authority:WEA",
    pdgov_org_entity: "361",
    pdgov_lpa_entity: "626241",
    planit_area_name: "Wealden",
    planit_area_id: 98,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 87717,
    planning_portal_url: "https://planning.wealden.gov.uk/Search/Advanced/",
    website: "https://www.wealden.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Welwyn Hatfield Borough Council",
    nation: "England",
    region: "East of England",
    county: "Hertfordshire",
    type: "district",
    gss_code: "E07000241",
    lpa_gss_code: "E60000175",
    pdgov_organisation: "local-authority:WEW",
    pdgov_org_entity: "364",
    pdgov_lpa_entity: "626175",
    planit_area_name: "Welwyn Hatfield",
    planit_area_id: 137,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 55717,
    planning_portal_url: "https://planning.welhat.gov.uk/Search/Advanced/",
    website: "https://www.welhat.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Berkshire Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000037",
    lpa_gss_code: "E60000230",
    pdgov_organisation: "local-authority:WBK",
    pdgov_org_entity: "358",
    pdgov_lpa_entity: "626230",
    planit_area_name: "West Berkshire",
    planit_area_id: 37,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 67226,
    planning_portal_url: "https://publicaccess.westberks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westberks.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Devon Borough Council",
    nation: "England",
    region: "South West",
    county: "Devon",
    type: "district",
    gss_code: "E07000047",
    lpa_gss_code: "E60000307",
    pdgov_organisation: "local-authority:WDE",
    pdgov_org_entity: "359",
    pdgov_lpa_entity: "626307",
    planit_area_name: "West Devon",
    planit_area_id: 87,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.westdevon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'South West Devon' (id 510, Atrium)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "West Lancashire Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000127",
    lpa_gss_code: "E60000045",
    pdgov_organisation: "local-authority:WLA",
    pdgov_org_entity: "371",
    pdgov_lpa_entity: "626045",
    planit_area_name: "West Lancashire",
    planit_area_id: 160,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 36212,
    planning_portal_url: "https://pa.westlancs.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westlancs.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Lindsey District Council",
    nation: "England",
    region: "East Midlands",
    county: "Lincolnshire",
    type: "district",
    gss_code: "E07000142",
    lpa_gss_code: "E60000098",
    pdgov_organisation: "local-authority:WLI",
    pdgov_org_entity: "372",
    pdgov_lpa_entity: "626098",
    planit_area_name: "West Lindsey",
    planit_area_id: 175,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 33323,
    planning_portal_url: "https://westlindsey-publicportal.statmap.co.uk/horizoNext/publicportal",
    website: "https://www.west-lindsey.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Northamptonshire Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "unitary",
    gss_code: "E06000062",
    lpa_gss_code: "E60000333",
    pdgov_organisation: "local-authority:WNUA",
    pdgov_org_entity: "501909",
    pdgov_lpa_entity: "626333",
    planit_area_name: "West Northamptonshire",
    planit_area_id: 519,
    planit_covered: "yes",
    planit_scraper_type: "Atrium Northants",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 130824,
    planning_portal_url: "https://wnc.planning-register.co.uk/Search/Advanced/",
    website: "https://www.westnorthants.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Oxfordshire District Council",
    nation: "England",
    region: "South East",
    county: "Oxfordshire",
    type: "district",
    gss_code: "E07000181",
    lpa_gss_code: "E60000269",
    pdgov_organisation: "local-authority:WOX",
    pdgov_org_entity: "383",
    pdgov_lpa_entity: "626269",
    planit_area_name: "West Oxfordshire",
    planit_area_id: 208,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 50596,
    planning_portal_url: "https://publicaccess.westoxon.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westoxon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Suffolk Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000245",
    lpa_gss_code: "E60000187",
    pdgov_organisation: "local-authority:WSK",
    pdgov_org_entity: "386",
    pdgov_lpa_entity: "626187",
    planit_area_name: "West Suffolk",
    planit_area_id: 497,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 69057,
    planning_portal_url: "https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westsuffolk.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Westmorland and Furness Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "unitary",
    gss_code: "E06000064",
    lpa_gss_code: "E60000335",
    pdgov_organisation: "local-authority:WFUA",
    pdgov_org_entity: "10001",
    pdgov_lpa_entity: "626335",
    planit_area_name: "Westmorland and Furness",
    planit_area_id: 523,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 61676,
    planning_portal_url: "https://planningregister.westmorlandandfurness.gov.uk/Search/Advanced",
    website: "https://www.westmorlandandfurness.gov.uk/",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wigan Metropolitan Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000010",
    lpa_gss_code: "E60000034",
    pdgov_organisation: "local-authority:WGN",
    pdgov_org_entity: "367",
    pdgov_lpa_entity: "626034",
    planit_area_name: "Wigan",
    planit_area_id: 267,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 45885,
    planning_portal_url: "https://planning.wigan.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.wigan.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wiltshire Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000054",
    lpa_gss_code: "E60000299",
    pdgov_organisation: "local-authority:WIL",
    pdgov_org_entity: "368",
    pdgov_lpa_entity: "626299",
    planit_area_name: "Wiltshire",
    planit_area_id: 54,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 230889,
    planning_portal_url: "https://development.wiltshire.gov.uk/pr/s/?tabset-167f1=3",
    website: "https://wiltshire.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Winchester City Council",
    nation: "England",
    region: "South East",
    county: "Hampshire",
    type: "district",
    gss_code: "E07000094",
    lpa_gss_code: "E60000252",
    pdgov_organisation: "local-authority:WIN",
    pdgov_org_entity: "369",
    pdgov_lpa_entity: "626252",
    planit_area_name: "Winchester",
    planit_area_id: 127,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 60675,
    planning_portal_url: "https://planningapps.winchester.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.winchester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wirral Borough Council",
    nation: "England",
    region: "North West",
    county: "",
    type: "metropolitan borough",
    gss_code: "E08000015",
    lpa_gss_code: "E60000051",
    pdgov_organisation: "local-authority:WRL",
    pdgov_org_entity: "384",
    pdgov_lpa_entity: "626051",
    planit_area_name: "Wirral",
    planit_area_id: 272,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-06-30",
    planit_total_apps: 51019,
    planning_portal_url: "https://online.wirral.gov.uk/planning/index.html?fa=search",
    website: "https://www.wirral.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "PlanIt data stale (latest 2026-06-30)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Woking Borough Council",
    nation: "England",
    region: "South East",
    county: "Surrey",
    type: "district",
    gss_code: "E07000217",
    lpa_gss_code: "E60000280",
    pdgov_organisation: "local-authority:WOI",
    pdgov_org_entity: "379",
    pdgov_lpa_entity: "626280",
    planit_area_name: "Woking",
    planit_area_id: 239,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 41160,
    planning_portal_url: "https://caps.woking.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.woking.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wokingham Borough Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "unitary",
    gss_code: "E06000041",
    lpa_gss_code: "E60000232",
    pdgov_organisation: "local-authority:WOK",
    pdgov_org_entity: "380",
    pdgov_lpa_entity: "626232",
    planit_area_name: "Wokingham",
    planit_area_id: 41,
    planit_covered: "yes",
    planit_scraper_type: "Fastweb",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 73640,
    planning_portal_url: "https://planning.wokingham.gov.uk/FastWebPL/search.asp",
    website: "https://www.wokingham.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Worcester City Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000237",
    lpa_gss_code: "E60000140",
    pdgov_organisation: "local-authority:WOC",
    pdgov_org_entity: "378",
    pdgov_lpa_entity: "626140",
    planit_area_name: "Worcester",
    planit_area_id: 255,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 23745,
    planning_portal_url: "https://plan.worcester.gov.uk/Search/Advanced/",
    website: "https://www.worcester.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Worthing Borough Council",
    nation: "England",
    region: "South East",
    county: "West Sussex",
    type: "district",
    gss_code: "E07000229",
    lpa_gss_code: "E60000287",
    pdgov_organisation: "local-authority:WOT",
    pdgov_org_entity: "382",
    pdgov_lpa_entity: "626287",
    planit_area_name: "Worthing",
    planit_area_id: 251,
    planit_covered: "yes (via shared service)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.adur-worthing.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.adur-worthing.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "applications under PlanIt area 'Adur and Worthing' (id 449, Idox)",
    api_notes: "PlanIt API: yes (via shared service); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wychavon District Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000238",
    lpa_gss_code: "E60000141",
    pdgov_organisation: "local-authority:WYC",
    pdgov_org_entity: "390",
    pdgov_lpa_entity: "626141",
    planit_area_name: "Wychavon",
    planit_area_id: 256,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 56322,
    planning_portal_url: "https://plan.wychavon.gov.uk/Search/Advanced/",
    website: "https://www.wychavon.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wyre Borough Council",
    nation: "England",
    region: "North West",
    county: "Lancashire",
    type: "district",
    gss_code: "E07000128",
    lpa_gss_code: "E60000046",
    pdgov_organisation: "local-authority:WYR",
    pdgov_org_entity: "394",
    pdgov_lpa_entity: "626046",
    planit_area_name: "Wyre",
    planit_area_id: 161,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 31657,
    planning_portal_url: "https://publicaccess.wyre.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.wyre.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wyre Forest District Council",
    nation: "England",
    region: "West Midlands",
    county: "Worcestershire",
    type: "district",
    gss_code: "E07000239",
    lpa_gss_code: "E60000142",
    pdgov_organisation: "local-authority:WYE",
    pdgov_org_entity: "392",
    pdgov_lpa_entity: "626142",
    planit_area_name: "Wyre Forest",
    planit_area_id: 257,
    planit_covered: "yes",
    planit_scraper_type: "Idox Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 21297,
    planning_portal_url: "https://planningpa.wyreforestdc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.wyreforestdc.gov.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Yorkshire Dales National Park Authority",
    nation: "England",
    region: "",
    county: "",
    type: "national park",
    gss_code: "E26000012",
    lpa_gss_code: "E60000327",
    pdgov_organisation: "national-park-authority:Q27178932",
    pdgov_org_entity: "398",
    pdgov_lpa_entity: "626327",
    planit_area_name: "Yorkshire Dales",
    planit_area_id: 361,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 21038,
    planning_portal_url: "https://planning.agileapplications.co.uk/yorkshiredales/search-applications/",
    website: "https://www.yorkshiredales.org.uk",
    pdgov_planning_application_data: "no (0 entities published; provision listed)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Antrim and Newtownabbey Borough Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000001",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Antrim and Newtownabbey",
    planit_area_id: 498,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 30760,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.antrimandnewtownabbey.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ards and North Down Borough Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000011",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Ards and North Down",
    planit_area_id: 499,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 36579,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.ardsandnorthdown.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Armagh City, Banbridge and Craigavon Borough Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000002",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Armagh Banbridge Craigavon",
    planit_area_id: 500,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 56555,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.armaghbanbridgecraigavon.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Belfast City Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000003",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Belfast",
    planit_area_id: 448,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 56233,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.belfastcity.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Causeway Coast and Glens Borough Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000004",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Causeway and Glens",
    planit_area_id: 501,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 48159,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.causewaycoastandglens.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Derry City and Strabane District Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000005",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Derry and Strabane",
    planit_area_id: 502,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 33456,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.derrycityandstrabanedistrict.com/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Fermanagh and Omagh District Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000006",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Fermanagh and Omagh",
    planit_area_id: 503,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 50488,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.fermanaghomagh.com/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Lisburn and Castlereagh City Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000007",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Lisburn and Castlereagh",
    planit_area_id: 504,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 36358,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.lisburncastlereagh.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mid Ulster District Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000009",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Mid Ulster",
    planit_area_id: 506,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 54168,
    planning_portal_url: "https://planning.midulstercouncil.org/online-applications/search.do?action=advanced",
    website: "https://www.midulstercouncil.org/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mid and East Antrim Borough Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000008",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Mid East Antrim",
    planit_area_id: 505,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 33227,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.midandeastantrim.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Newry, Mourne and Down District Council",
    nation: "Northern Ireland",
    region: "",
    county: "",
    type: "district council",
    gss_code: "N09000010",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Newry Mourne Down",
    planit_area_id: 507,
    planit_covered: "yes",
    planit_scraper_type: "NIPortal",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 62901,
    planning_portal_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    website: "https://www.newrymournedown.org/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Aberdeen City Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000033",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Aberdeen",
    planit_area_id: 384,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 48894,
    planning_portal_url: "https://publicaccess.aberdeencity.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.aberdeencity.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Aberdeenshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000034",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Aberdeenshire",
    planit_area_id: 385,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 78715,
    planning_portal_url: "https://upa.aberdeenshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.aberdeenshire.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Angus Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000041",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Angus",
    planit_area_id: 391,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 30243,
    planning_portal_url: "https://planning.angus.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.angus.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Argyll and Bute Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000035",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Argyll",
    planit_area_id: 386,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-06",
    planit_total_apps: 46889,
    planning_portal_url: "https://publicaccess.argyll-bute.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.argyll-bute.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cairngorms National Park",
    nation: "Scotland",
    region: "",
    county: "",
    type: "national park",
    gss_code: "S21000003",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Cairngorms",
    planit_area_id: 397,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 9896,
    planning_portal_url: "https://www.eplanningcnpa.co.uk/online-applications/search.do?action=advanced",
    website: "https://cairngorms.co.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Clackmannanshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000005",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Clackmannanshire",
    planit_area_id: 364,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 8399,
    planning_portal_url: "https://publicaccess.clacks.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.clacks.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dumfries and Galloway Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000006",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Dumfries",
    planit_area_id: 365,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 54720,
    planning_portal_url: "https://eaccess.dumgal.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.dumgal.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Dundee City Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000042",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Dundee",
    planit_area_id: 392,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 20809,
    planning_portal_url: "https://idoxwam.dundeecity.gov.uk/idoxpa-web/search.do?action=advanced",
    website: "https://www.dundeecity.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Ayrshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000008",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "East Ayrshire",
    planit_area_id: 366,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 26354,
    planning_portal_url: "https://eplanning.east-ayrshire.gov.uk/online/search.do?action=advanced",
    website: "https://www.east-ayrshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Dunbartonshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000045",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "East Dunbartonshire",
    planit_area_id: 394,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 21412,
    planning_portal_url: "https://planning.eastdunbarton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.eastdunbarton.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Lothian District Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000010",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "East Lothian",
    planit_area_id: 367,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 29669,
    planning_portal_url: "https://pa.eastlothian.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.eastlothian.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "East Renfrewshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000011",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "East Renfrewshire",
    planit_area_id: 368,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 20302,
    planning_portal_url: "https://ercbuildingstandards.eastrenfrewshire.gov.uk/buildingstandards/search.do?action=advanced",
    website: "https://www.eastrenfrewshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Edinburgh City Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000036",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Edinburgh",
    planit_area_id: 387,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 126960,
    planning_portal_url: "https://citydev-portal.edinburgh.gov.uk/idoxpa-web/search.do?action=advanced",
    website: "https://www.edinburgh.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Falkirk Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000014",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Falkirk",
    planit_area_id: 370,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 20837,
    planning_portal_url: "https://edevelopment.falkirk.gov.uk/online/search.do?action=advanced",
    website: "https://www.falkirk.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Fife Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000015",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Fife",
    planit_area_id: 371,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 79893,
    planning_portal_url: "https://planning.fife.gov.uk/online/search.do?action=advanced",
    website: "https://www.fife.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Glasgow City Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000046",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Glasgow",
    planit_area_id: 395,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 70861,
    planning_portal_url: "https://publicaccess.glasgow.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.glasgow.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Highland Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000017",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Highland",
    planit_area_id: 372,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 95324,
    planning_portal_url: "https://wam.highland.gov.uk/wam/search.do?action=advanced",
    website: "https://www.highland.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Inverclyde Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000018",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Inverclyde",
    planit_area_id: 373,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 7972,
    planning_portal_url: "https://planning.inverclyde.gov.uk/Online/search.do?action=advanced",
    website: "https://www.inverclyde.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Loch Lomond and The Trossachs National Park",
    nation: "Scotland",
    region: "",
    county: "",
    type: "national park",
    gss_code: "S21000002",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Loch Lomond",
    planit_area_id: 396,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 9780,
    planning_portal_url: "https://eplanning.lochlomond-trossachs.org/OnlinePlanning/search.do?action=advanced",
    website: "https://www.lochlomond-trossachs.org/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Midlothian Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000019",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Midlothian",
    planit_area_id: 374,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 17667,
    planning_portal_url: "https://planning-applications.midlothian.gov.uk/OnlinePlanning/search.do?action=advanced",
    website: "https://www.midlothian.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Moray Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000020",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Moray",
    planit_area_id: 375,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 26926,
    planning_portal_url: "https://publicaccess.moray.gov.uk/eplanning/search.do?action=advanced",
    website: "https://www.moray.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Ayrshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000021",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "North Ayrshire",
    planit_area_id: 376,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 21518,
    planning_portal_url: "https://www.eplanning.north-ayrshire.gov.uk/OnlinePlanning/search.do?action=advanced",
    website: "https://www.north-ayrshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Lanarkshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000044",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "North Lanarkshire",
    planit_area_id: 393,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 41936,
    planning_portal_url: "https://eplanning.northlanarkshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.northlan.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Orkney Islands Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000023",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Orkney",
    planit_area_id: 377,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-16",
    planit_total_apps: 11772,
    planning_portal_url: "https://planningandwarrant.orkney.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.orkney.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Perth and Kinross Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000024",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Perth",
    planit_area_id: 378,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 51219,
    planning_portal_url: "https://planningapps.pkc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.pkc.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Renfrewshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000038",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Renfrewshire",
    planit_area_id: 388,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 22850,
    planning_portal_url: "https://pl-bs.renfrewshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.renfrewshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Scottish Borders Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000026",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Scottish Borders",
    planit_area_id: 379,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 41009,
    planning_portal_url: "https://eplanning.scotborders.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.scotborders.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Shetland Islands Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000027",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Shetlands",
    planit_area_id: 380,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 12322,
    planning_portal_url: "https://pa.shetland.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.shetland.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Ayrshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000028",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "South Ayrshire",
    planit_area_id: 381,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 32579,
    planning_portal_url: "https://publicaccess.south-ayrshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.south-ayrshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Lanarkshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000029",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "South Lanarkshire",
    planit_area_id: 382,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 40502,
    planning_portal_url: "https://publicaccess.southlanarkshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southlanarkshire.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Stirling Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000030",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Stirling",
    planit_area_id: 383,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 24341,
    planning_portal_url: "https://pabs.stirling.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.stirling.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Dunbartonshire Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000039",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "West Dunbartonshire",
    planit_area_id: 389,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 8593,
    planning_portal_url: "https://apps.west-dunbarton.gov.uk/dcsearch_app.asp",
    website: "https://www.west-dunbarton.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "West Lothian Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000040",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "West Lothian",
    planit_area_id: 390,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 28026,
    planning_portal_url: "https://planning.westlothian.gov.uk/publicaccess/search.do?action=advanced",
    website: "https://www.westlothian.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Western Isles Council",
    nation: "Scotland",
    region: "",
    county: "",
    type: "council",
    gss_code: "S12000013",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Western Isles",
    planit_area_id: 369,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-30",
    planit_total_apps: 14645,
    planning_portal_url: "https://planning.cne-siar.gov.uk/PublicAccess/search.do?action=advanced",
    website: "https://www.cne-siar.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Blaenau Gwent County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000019",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Blaenau Gwent",
    planit_area_id: 414,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 4228,
    planning_portal_url: "https://developmentservices.blaenau-gwent.gov.uk/planning/index.html?fa=search",
    website: "https://www.blaenau-gwent.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Brecon Beacons National Park",
    nation: "Wales",
    region: "",
    county: "",
    type: "national park",
    gss_code: "W18000001",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Brecon Beacons",
    planit_area_id: 420,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 13824,
    planning_portal_url: "https://planningonline.beacons-npa.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.beacons-npa.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Bridgend County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000013",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Bridgend",
    planit_area_id: 409,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 32997,
    planning_portal_url: "https://planning.bridgend.gov.uk/search/Planning/Advanced/",
    website: "https://www.bridgend.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Caerphilly County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000018",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Caerphilly",
    planit_area_id: 413,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 30634,
    planning_portal_url: "https://publicaccess.caerphilly.gov.uk/PublicAccess/search.do?action=advanced",
    website: "https://www.caerphilly.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Cardiff Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000015",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Cardiff",
    planit_area_id: 411,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 77242,
    planning_portal_url: "https://www.cardiffidoxcloud.wales/publicaccess/search.do?action=advanced",
    website: "https://www.cardiff.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Carmarthenshire County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000010",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Carmarthenshire",
    planit_area_id: 406,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 55445,
    planning_portal_url: "https://carmarthenshire.my.site.com/en/s/?tabset-a3431=3",
    website: "https://www.carmarthenshire.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ceredigion County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000008",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Ceredigion",
    planit_area_id: 404,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-06-23",
    planit_total_apps: 29339,
    planning_portal_url: "https://ceredigion-online.tascomi.com/planning/index.html?fa=search",
    website: "https://www.ceredigion.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-06-23)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "City and County of Swansea",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000011",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Swansea",
    planit_area_id: 407,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 61148,
    planning_portal_url: "https://property.swansea.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.swansea.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Conwy County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000003",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Conwy",
    planit_area_id: 400,
    planit_covered: "yes",
    planit_scraper_type: "PlanningExplorer",
    planit_latest_app_date: "2026-10-20",
    planit_total_apps: 30211,
    planning_portal_url: "https://npe.conwy.gov.uk/Northgate/EnglishPlanningExplorer/generalsearch.aspx",
    website: "https://www.conwy.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Denbighshire County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000004",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Denbighshire",
    planit_area_id: 401,
    planit_covered: "yes",
    planit_scraper_type: "CivicaJson Tascomi",
    planit_latest_app_date: "2026-06-19",
    planit_total_apps: 29845,
    planning_portal_url: "https://planningandpublicprotection.denbighshire.gov.uk/planning/index.html?fa=search",
    website: "https://www.denbighshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-06-19)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Flintshire County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000005",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Flintshire",
    planit_area_id: 402,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 35821,
    planning_portal_url: "https://planning.agileapplications.co.uk/flintshire/search-applications/",
    website: "https://www.flintshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Gwynedd County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000002",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Gwynedd",
    planit_area_id: 399,
    planit_covered: "yes",
    planit_scraper_type: "Tascomi",
    planit_latest_app_date: "2026-07-02",
    planit_total_apps: 34356,
    planning_portal_url: "https://amg.gwynedd.llyw.cymru/planning/index.html?fa=search",
    website: "https://www.gwynedd.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only); PlanIt data stale (latest 2026-07-02)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Isle of Anglesey County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000001",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Anglesey",
    planit_area_id: 398,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 28650,
    planning_portal_url: "https://planning-public-register.anglesey.gov.wales/prIoA/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.anglesey.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Merthyr Tydfil County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000024",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Merthyr Tydfil",
    planit_area_id: 419,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 11781,
    planning_portal_url: "https://publicaccess.merthyr.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.merthyr.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Monmouthshire County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000021",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Monmouthshire",
    planit_area_id: 416,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 33777,
    planning_portal_url: "https://planningonline.monmouthshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.monmouthshire.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Neath & Port Talbot County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000012",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Neath",
    planit_area_id: 408,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 31123,
    planning_portal_url: "https://planningonline.npt.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.neath-porttalbot.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Newport City Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000022",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Newport",
    planit_area_id: 417,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 35752,
    planning_portal_url: "https://publicaccess.newport.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.newport.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Pembrokeshire Coast National Park",
    nation: "Wales",
    region: "",
    county: "",
    type: "national park",
    gss_code: "W18000002",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Pembroke Coast",
    planit_area_id: 421,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 17177,
    planning_portal_url: "https://planning.agileapplications.co.uk/pcnpa/search-applications/",
    website: "https://www.pembrokeshirecoast.org.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Pembrokeshire County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000009",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Pembrokeshire",
    planit_area_id: 405,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-21",
    planit_total_apps: 33986,
    planning_portal_url: "https://planning.agileapplications.co.uk/pembrokeshire/search-applications/",
    website: "https://www.pembrokeshire.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Powys County Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000023",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Powys",
    planit_area_id: 418,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 48893,
    planning_portal_url: "https://service.powys.gov.uk/pr/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.powys.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Rhondda Cynnon Taf County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000016",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Rhondda",
    planit_area_id: 412,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 80214,
    planning_portal_url: "https://planonline.rctcbc.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.rhondda-cynon-taf.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Snowdonia National Park Authority",
    nation: "Wales",
    region: "",
    county: "",
    type: "national park",
    gss_code: "W18000003",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Snowdonia",
    planit_area_id: 422,
    planit_covered: "yes",
    planit_scraper_type: "Agile",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 14734,
    planning_portal_url: "https://planning.agileapplications.co.uk/snowdonia/search-applications/",
    website: "https://www.snowdonia-npa.gov.uk/",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Torfaen County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000020",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Torfaen",
    planit_area_id: 415,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-27",
    planit_total_apps: 18244,
    planning_portal_url: "https://planningonline.torfaen.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.torfaen.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Vale of Glamorgan Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000014",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Glamorgan",
    planit_area_id: 410,
    planit_covered: "yes",
    planit_scraper_type: "Atrium",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 42821,
    planning_portal_url: "https://vogonline.planning-register.co.uk/Search/Planning/Advanced/",
    website: "https://www.valeofglamorgan.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wrexham County Borough Council",
    nation: "Wales",
    region: "",
    county: "",
    type: "council",
    gss_code: "W06000006",
    lpa_gss_code: "",
    pdgov_organisation: "",
    pdgov_org_entity: "",
    pdgov_lpa_entity: "",
    planit_area_name: "Wrexham",
    planit_area_id: 403,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-22",
    planit_total_apps: 30297,
    planning_portal_url: "https://register.wrexham.gov.uk/pr/s/register-view?language=en_GB&c__r=Arcus_BE_Public_Register",
    website: "https://www.wrexham.gov.uk",
    pdgov_planning_application_data: "n/a (England only)",
    status: "active",
    end_date: "",
    successor: "",
    notes: "name/GSS from PlanIt; not in planning.data.gov.uk (England-only)",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Allerdale Borough Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000026",
    lpa_gss_code: "E60000019",
    pdgov_organisation: "local-authority:ALL",
    pdgov_org_entity: "27",
    pdgov_lpa_entity: "626019",
    planit_area_name: "Allerdale",
    planit_area_id: 66,
    planit_covered: "yes",
    planit_scraper_type: "Arcus",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 34546,
    planning_portal_url: "https://cumberlandcouncil.my.site.com/pr3/s/register-view?c__r=Arcus_BE_Public_Register",
    website: "https://www.allerdale.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Cumberland Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Aylesbury Vale District Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "district",
    gss_code: "E07000004",
    lpa_gss_code: "E60000233",
    pdgov_organisation: "local-authority:AYL",
    pdgov_org_entity: "32",
    pdgov_lpa_entity: "626233",
    planit_area_name: "Aylesbury Vale",
    planit_area_id: 57,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.aylesburyvaledc.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2020-03-31",
    successor: "Buckinghamshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Barrow-in-Furness Borough Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000027",
    lpa_gss_code: "E60000020",
    pdgov_organisation: "local-authority:BAR",
    pdgov_org_entity: "37",
    pdgov_lpa_entity: "626020",
    planit_area_name: "Barrow",
    planit_area_id: 67,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-15",
    planit_total_apps: 5854,
    planning_portal_url: "https://webapps.barrowbc.gov.uk/webapps/f?p=BARROWPLANNINGHUB:APPLICATIONSEARCH:0",
    website: "https://www.barrowbc.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Westmorland and Furness Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Borough of Poole",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000029",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:POL",
    pdgov_org_entity: "254",
    pdgov_lpa_entity: "",
    planit_area_name: "Poole",
    planit_area_id: 29,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.boroughofpoole.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "BCP Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Bournemouth Borough Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "unitary",
    gss_code: "E06000028",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:BMH",
    pdgov_org_entity: "47",
    pdgov_lpa_entity: "",
    planit_area_name: "Bournemouth",
    planit_area_id: 28,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.bournemouth.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "BCP Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Carlisle City Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000028",
    lpa_gss_code: "E60000021",
    pdgov_organisation: "local-authority:CAR",
    pdgov_org_entity: "73",
    pdgov_lpa_entity: "626021",
    planit_area_name: "Carlisle",
    planit_area_id: 68,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 34020,
    planning_portal_url: "https://publicaccess.carlisle.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.carlisle.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Cumberland Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Chiltern District Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "district",
    gss_code: "E07000005",
    lpa_gss_code: "E60000234",
    pdgov_organisation: "local-authority:CHN",
    pdgov_org_entity: "82",
    pdgov_lpa_entity: "626234",
    planit_area_name: "Chiltern",
    planit_area_id: 58,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://pa.chilternsouthbucks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.chiltern.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2020-03-31",
    successor: "Buckinghamshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Christchurch Borough Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000048",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:CHC",
    pdgov_org_entity: "78",
    pdgov_lpa_entity: "",
    planit_area_name: "Christchurch",
    planit_area_id: 88,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.dorsetforyou.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "BCP Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Copeland Borough Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000029",
    lpa_gss_code: "E60000022",
    pdgov_organisation: "local-authority:COP",
    pdgov_org_entity: "93",
    pdgov_lpa_entity: "626022",
    planit_area_name: "Copeland",
    planit_area_id: 69,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 2882,
    planning_portal_url: "https://www.cumberland.gov.uk/planning/application-search",
    website: "https://www.copeland.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Cumberland Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Corby Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000150",
    lpa_gss_code: "E60000099",
    pdgov_organisation: "local-authority:COR",
    pdgov_org_entity: "94",
    pdgov_lpa_entity: "626099",
    planit_area_name: "Corby",
    planit_area_id: 183,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.corby.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "North Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Craven District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000163",
    lpa_gss_code: "E60000057",
    pdgov_organisation: "local-authority:CRA",
    pdgov_org_entity: "98",
    pdgov_lpa_entity: "626057",
    planit_area_name: "Craven",
    planit_area_id: 190,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2025-12-22",
    planit_total_apps: 25920,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.cravendc.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Daventry District Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000151",
    lpa_gss_code: "E60000100",
    pdgov_organisation: "local-authority:DAV",
    pdgov_org_entity: "104",
    pdgov_lpa_entity: "626100",
    planit_area_name: "Daventry",
    planit_area_id: 184,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.daventrydc.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "West Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "East Dorset District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000049",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:EDO",
    pdgov_org_entity: "121",
    pdgov_lpa_entity: "",
    planit_area_name: "East Dorset",
    planit_area_id: 89,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "http://www.eastdorsetdc.gov.uk/",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Dorset Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "East Northamptonshire Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000152",
    lpa_gss_code: "E60000101",
    pdgov_organisation: "local-authority:ENO",
    pdgov_org_entity: "127",
    pdgov_lpa_entity: "626101",
    planit_area_name: "East Northamptonshire",
    planit_area_id: 185,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.east-northamptonshire.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "North Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Eden District Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000030",
    lpa_gss_code: "E60000023",
    pdgov_organisation: "local-authority:EDN",
    pdgov_org_entity: "120",
    pdgov_lpa_entity: "626023",
    planit_area_name: "Eden",
    planit_area_id: 70,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.eden.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Westmorland and Furness Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Forest Heath District Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000201",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:FOR",
    pdgov_org_entity: "140",
    pdgov_lpa_entity: "",
    planit_area_name: "Forest Heath",
    planit_area_id: 223,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.forest-heath.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "West Suffolk Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Hambleton District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000164",
    lpa_gss_code: "E60000058",
    pdgov_organisation: "local-authority:HAE",
    pdgov_org_entity: "154",
    pdgov_lpa_entity: "626058",
    planit_area_name: "Hambleton",
    planit_area_id: 191,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-06-10",
    planit_total_apps: 92972,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.hambleton.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Harrogate Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000165",
    lpa_gss_code: "E60000059",
    pdgov_organisation: "local-authority:HAG",
    pdgov_org_entity: "155",
    pdgov_lpa_entity: "626059",
    planit_area_name: "Harrogate",
    planit_area_id: 192,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2025-04-08",
    planit_total_apps: 80459,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.harrogate.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Kettering Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000153",
    lpa_gss_code: "E60000102",
    pdgov_organisation: "local-authority:KET",
    pdgov_org_entity: "184",
    pdgov_lpa_entity: "626102",
    planit_area_name: "Kettering",
    planit_area_id: 186,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.kettering.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "North Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "London Legacy Development Corporation",
    nation: "England",
    region: "",
    county: "",
    type: "development corporation",
    gss_code: "E51000001",
    lpa_gss_code: "E60000329",
    pdgov_organisation: "development-corporation:Q6670544",
    pdgov_org_entity: "3",
    pdgov_lpa_entity: "626329",
    planit_area_name: "London Legacy",
    planit_area_id: 496,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://www.queenelizabetholympicpark.co.uk/transfer-planning-powers",
    website: "https://www.queenelizabetholympicpark.co.uk/planning-authority/planning-policy",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2024-12-01",
    successor: "Planning powers returned to LB Hackney, Newham, Tower Hamlets, Waltham Forest (Dec 2024)",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Mendip District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000187",
    lpa_gss_code: "E60000314",
    pdgov_organisation: "local-authority:MEN",
    pdgov_org_entity: "214",
    pdgov_lpa_entity: "626314",
    planit_area_name: "Mendip",
    planit_area_id: 209,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-28",
    planit_total_apps: 58848,
    planning_portal_url: "https://publicaccess.mendip.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.mendip.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Somerset Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "North Dorset District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000050",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:NDO",
    pdgov_org_entity: "222",
    pdgov_lpa_entity: "",
    planit_area_name: "North Dorset",
    planit_area_id: 90,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.dorsetforyou.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Dorset Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Northampton Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000154",
    lpa_gss_code: "E60000103",
    pdgov_organisation: "local-authority:NOR",
    pdgov_org_entity: "236",
    pdgov_lpa_entity: "626103",
    planit_area_name: "Northampton",
    planit_area_id: 187,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.northampton.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2020-03-31",
    successor: "West Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Purbeck District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000051",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:PUR",
    pdgov_org_entity: "258",
    pdgov_lpa_entity: "",
    planit_area_name: "Purbeck",
    planit_area_id: 91,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.dorsetforyou.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Dorset Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Richmondshire District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000166",
    lpa_gss_code: "E60000060",
    pdgov_organisation: "local-authority:RIH",
    pdgov_org_entity: "267",
    pdgov_lpa_entity: "626060",
    planit_area_name: "Richmondshire",
    planit_area_id: 193,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-06",
    planit_total_apps: 19090,
    planning_portal_url: "https://planning.richmondshire.gov.uk/online-applications/search.do?action=advanced",
    website: "https://richmondshire.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Ryedale District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000167",
    lpa_gss_code: "E60000061",
    pdgov_organisation: "local-authority:RYE",
    pdgov_org_entity: "277",
    pdgov_lpa_entity: "626061",
    planit_area_name: "Ryedale",
    planit_area_id: 194,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-09-22",
    planit_total_apps: 19860,
    planning_portal_url: "https://planningregister.ryedale.gov.uk/caonline-applications/search.do?action=advanced",
    website: "https://www.ryedale.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Scarborough Borough Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000168",
    lpa_gss_code: "E60000062",
    pdgov_organisation: "local-authority:SCE",
    pdgov_org_entity: "282",
    pdgov_lpa_entity: "626062",
    planit_area_name: "Scarborough",
    planit_area_id: 195,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2025-10-20",
    planit_total_apps: 25629,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.scarborough.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Sedgemoor District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000188",
    lpa_gss_code: "E60000315",
    pdgov_organisation: "local-authority:SEG",
    pdgov_org_entity: "286",
    pdgov_lpa_entity: "626315",
    planit_area_name: "Sedgemoor",
    planit_area_id: 210,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 43522,
    planning_portal_url: "https://sdc.somerset.gov.uk/Planning_Online/",
    website: "https://www.sedgemoor.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Somerset Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Selby District Council",
    nation: "England",
    region: "Yorkshire and The Humber",
    county: "",
    type: "district",
    gss_code: "E07000169",
    lpa_gss_code: "E60000063",
    pdgov_organisation: "local-authority:SEL",
    pdgov_org_entity: "287",
    pdgov_lpa_entity: "626063",
    planit_area_name: "Selby",
    planit_area_id: 196,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-06-08",
    planit_total_apps: 59784,
    planning_portal_url: "https://publicaccess.northyorks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.selby.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "North Yorkshire Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Somerset West and Taunton Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000246",
    lpa_gss_code: "E60000316",
    pdgov_organisation: "local-authority:SWT",
    pdgov_org_entity: "331",
    pdgov_lpa_entity: "626316",
    planit_area_name: "Somerset West and Taunton",
    planit_area_id: 517,
    planit_covered: "yes (via legacy/child areas)",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://www.somersetwestandtaunton.gov.uk/planning/find-a-planning-application/",
    website: "https://www.somersetwestandtaunton.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Somerset Council",
    notes: "applications under PlanIt areas: Taunton Deane (Custom), West Somerset (Idox)",
    api_notes: "PlanIt API: yes (via legacy/child areas); planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Bucks District Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "district",
    gss_code: "E07000006",
    lpa_gss_code: "E60000235",
    pdgov_organisation: "local-authority:SBU",
    pdgov_org_entity: "280",
    pdgov_lpa_entity: "626235",
    planit_area_name: "South Bucks",
    planit_area_id: 59,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://pa.chilternsouthbucks.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southbucks.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2020-03-31",
    successor: "Buckinghamshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "South Lakeland District Council",
    nation: "England",
    region: "North West",
    county: "Cumbria",
    type: "district",
    gss_code: "E07000031",
    lpa_gss_code: "E60000024",
    pdgov_organisation: "local-authority:SLA",
    pdgov_org_entity: "300",
    pdgov_lpa_entity: "626024",
    planit_area_name: "South Lakeland",
    planit_area_id: 71,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.southlakeland.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Westmorland and Furness Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "South Northamptonshire Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000155",
    lpa_gss_code: "E60000104",
    pdgov_organisation: "local-authority:SNR",
    pdgov_org_entity: "305",
    pdgov_lpa_entity: "626104",
    planit_area_name: "South Northamptonshire",
    planit_area_id: 188,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.southnorthants.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "West Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "South Somerset District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000189",
    lpa_gss_code: "E60000317",
    pdgov_organisation: "local-authority:SSO",
    pdgov_org_entity: "313",
    pdgov_lpa_entity: "626317",
    planit_area_name: "South Somerset",
    planit_area_id: 211,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-29",
    planit_total_apps: 74480,
    planning_portal_url: "https://publicaccess.southsomerset.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.southsomerset.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2023-03-31",
    successor: "Somerset Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "St Edmundsbury Borough Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000204",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:SED",
    pdgov_org_entity: "285",
    pdgov_lpa_entity: "",
    planit_area_name: "St Edmundsbury",
    planit_area_id: 226,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://planning.westsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.stedmundsbury.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "West Suffolk Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Suffolk Coastal District Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000205",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:SUF",
    pdgov_org_entity: "326",
    pdgov_lpa_entity: "",
    planit_area_name: "Suffolk Coastal",
    planit_area_id: 227,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.suffolkcoastal.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "East Suffolk Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Taunton Deane Borough Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000190",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:TAU",
    pdgov_org_entity: "334",
    pdgov_lpa_entity: "",
    planit_area_name: "Taunton Deane",
    planit_area_id: 212,
    planit_covered: "yes",
    planit_scraper_type: "Custom",
    planit_latest_app_date: "2026-10-23",
    planit_total_apps: 39610,
    planning_portal_url: "https://www3.somersetwestandtaunton.gov.uk/asp/webpages/plan/plapplookup.asp",
    website: "https://www.tauntondeane.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Somerset West and Taunton Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Waveney District Council",
    nation: "England",
    region: "East of England",
    county: "Suffolk",
    type: "district",
    gss_code: "E07000206",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:WAV",
    pdgov_org_entity: "356",
    pdgov_lpa_entity: "",
    planit_area_name: "Waveney",
    planit_area_id: 228,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "https://publicaccess.eastsuffolk.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.waveney.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "East Suffolk Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Wellingborough Borough Council",
    nation: "England",
    region: "East Midlands",
    county: "",
    type: "district",
    gss_code: "E07000156",
    lpa_gss_code: "E60000105",
    pdgov_organisation: "local-authority:WEL",
    pdgov_org_entity: "363",
    pdgov_lpa_entity: "626105",
    planit_area_name: "Wellingborough",
    planit_area_id: 189,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.wellingborough.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2021-03-31",
    successor: "North Northamptonshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "West Dorset District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000052",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:WDO",
    pdgov_org_entity: "360",
    pdgov_lpa_entity: "",
    planit_area_name: "West Dorset",
    planit_area_id: 92,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.dorsetforyou.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Dorset Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "West Somerset District Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000191",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:WSO",
    pdgov_org_entity: "388",
    pdgov_lpa_entity: "",
    planit_area_name: "West Somerset",
    planit_area_id: 213,
    planit_covered: "yes",
    planit_scraper_type: "Idox",
    planit_latest_app_date: "2026-10-26",
    planit_total_apps: 12749,
    planning_portal_url: "https://www1.somersetwestandtaunton.gov.uk/online-applications/search.do?action=advanced",
    website: "https://www.westsomersetonline.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Somerset West and Taunton Council",
    notes: "",
    api_notes: "PlanIt API: yes; planning.data.gov.uk planning-application: no",
    missing_fields: ""
  },
  {
    name: "Weymouth and Portland Borough Council",
    nation: "England",
    region: "South West",
    county: "",
    type: "district",
    gss_code: "E07000053",
    lpa_gss_code: "",
    pdgov_organisation: "local-authority:WEY",
    pdgov_org_entity: "365",
    pdgov_lpa_entity: "",
    planit_area_name: "Weymouth",
    planit_area_id: 93,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.dorsetforyou.com",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2019-03-31",
    successor: "Dorset Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  },
  {
    name: "Wycombe District Council",
    nation: "England",
    region: "South East",
    county: "",
    type: "district",
    gss_code: "E07000007",
    lpa_gss_code: "E60000236",
    pdgov_organisation: "local-authority:WYO",
    pdgov_org_entity: "393",
    pdgov_lpa_entity: "626236",
    planit_area_name: "Wycombe",
    planit_area_id: 60,
    planit_covered: "no",
    planit_scraper_type: "",
    planit_latest_app_date: "",
    planit_total_apps: "",
    planning_portal_url: "",
    website: "https://www.wycombe.gov.uk",
    pdgov_planning_application_data: "no",
    status: "abolished",
    end_date: "2020-03-31",
    successor: "Buckinghamshire Council",
    notes: "PlanIt area exists but is_planning=false",
    api_notes: "PlanIt API: no; planning.data.gov.uk planning-application: no",
    missing_fields: "planning_portal_url"
  }
];

// ../../packages/shared/src/lpas.ts
var ENGLAND_REGION = {
  "Colchester City Council": "East of England",
  "Cumberland Council": "North West",
  "Broads Authority": "East of England",
  "Dartmoor National Park Authority": "South West",
  "Exmoor National Park Authority": "South West",
  "Ebbsfleet Development Corporation": "South East",
  "Hartlepool Development Corporation": "North East",
  "Lake District National Park Authority": "North West",
  "Middlesbrough Development Corporation": "North East",
  "New Forest National Park Authority": "South East",
  "North York Moors National Park Authority": "Yorkshire and the Humber",
  "Northumberland National Park Authority": "North East",
  "Old Oak and Park Royal Development Corporation": "London",
  "Peak District National Park Authority": "East Midlands",
  "South Downs National Park Authority": "South East",
  "Yorkshire Dales National Park Authority": "Yorkshire and the Humber"
};
var LPA_REGIONS = [
  "London",
  "South East",
  "South West",
  "East of England",
  "East Midlands",
  "West Midlands",
  "Yorkshire and the Humber",
  "North East",
  "North West",
  "Scotland",
  "Wales",
  "Northern Ireland"
];
function numberOrNull(value) {
  return typeof value === "number" ? value : null;
}
function regionFor(row) {
  if (ENGLAND_REGION[row.name]) return ENGLAND_REGION[row.name];
  if (row.region === "Yorkshire and The Humber") return "Yorkshire and the Humber";
  if (row.region) return row.region;
  if (row.nation === "Scotland" || row.nation === "Wales" || row.nation === "Northern Ireland") return row.nation;
  return "England";
}
function coverageFor(covered) {
  if (covered === "no" || covered === "") return "unavailable";
  if (covered.includes("legacy")) return "legacy";
  if (covered.includes("shared")) return "shared";
  return "available";
}
function queryAreas(row) {
  if (row.planit_covered === "no" || row.planit_covered === "") return [];
  if (row.planit_covered.includes("legacy")) return ["Allerdale", "Carlisle", "Copeland"];
  const shared = row.notes.match(/PlanIt area '([^']+)'/);
  if (shared?.[1]) return [shared[1]];
  return row.planit_area_name ? [row.planit_area_name] : [];
}
var LPA_RECORDS = uk_lpa_master_default.map((row) => ({
  name: row.name,
  nation: row.nation,
  region: regionFor(row),
  county: row.county,
  type: row.type,
  gssCode: row.gss_code,
  lpaGssCode: row.lpa_gss_code,
  planitAreaName: row.planit_area_name,
  planitAreaId: numberOrNull(row.planit_area_id),
  planitCovered: row.planit_covered,
  planitScraperType: row.planit_scraper_type,
  planitLatestAppDate: row.planit_latest_app_date || null,
  planitTotalApps: numberOrNull(row.planit_total_apps),
  planningPortalUrl: row.planning_portal_url,
  website: row.website,
  status: row.status === "abolished" ? "abolished" : "active",
  endDate: row.end_date || null,
  successor: row.successor,
  notes: row.notes,
  coverage: coverageFor(row.planit_covered),
  planitQueryAreas: queryAreas(row)
}));
var byGss = new Map(LPA_RECORDS.map((row) => [row.gssCode, row]));
function lpaAreas() {
  const grouped = /* @__PURE__ */ new Map();
  for (const region of LPA_REGIONS) grouped.set(region, []);
  for (const row of LPA_RECORDS) {
    if (row.status !== "active") continue;
    const list = grouped.get(row.region) ?? [];
    list.push(row.name);
    grouped.set(row.region, list);
  }
  return LPA_REGIONS.map((region) => ({ region, councils: (grouped.get(region) ?? []).sort((a, b2) => a.localeCompare(b2)) }));
}

// ../../packages/shared/src/onboarding.ts
var UK_AREAS = lpaAreas();
var regionNames = new Set(UK_AREAS.map((area) => area.region));
function alertDue(frequency, lastSent, now = /* @__PURE__ */ new Date()) {
  if (frequency === "off") return false;
  if (frequency === "immediate" || !lastSent) return true;
  const elapsed = now.getTime() - lastSent.getTime();
  if (frequency === "daily") return elapsed >= 20 * 60 * 60 * 1e3;
  if (frequency === "weekly") return elapsed >= 6 * 24 * 60 * 60 * 1e3;
  return false;
}

// ../../packages/shared/src/index.ts
var MASTER_COLUMNS = [
  "Heading",
  "\xA3m Value From",
  "\xA3m Value To",
  "Proposal",
  "Site Raw Address",
  "Client Applicant Contact",
  "Client Applicant",
  "Client Applicant Raw Address",
  "Client Applicant Phone",
  "Architect Agent Contact",
  "Architect Agent",
  "Architect Agent Raw Address",
  "Architect Agent Phone",
  "Architect Agent Email",
  "Mail Client Contact",
  "Mail Client Name",
  "Client Applicant Address Line 1",
  "Client Applicant Address Line 2",
  "Client Applicant Address Line 3",
  "Client Applicant Address Line 4",
  "Client Applicant Postcode",
  "Client Applicant Postcode Area",
  "Mail Architect Agent Contact",
  "Mail Architect Agent Name",
  "Architect Agent Address Line 1",
  "Architect Agent Address Line 2",
  "Architect Agent Address Line 3",
  "Architect Agent Address Line 4",
  "Architect Agent Postcode",
  "Architect Agent Postcode Area",
  "Site Address",
  "Site Address Postcode Area",
  "Prop Type",
  "\xA3m Est Prop Val From",
  "\xA3m Est Prop Val To",
  "URL Link",
  "Local Authority",
  "Application Reference",
  "County",
  "Region",
  "Project Stage",
  "Publication Date",
  "Project ID",
  "Project Category"
];
function csvCell(value) {
  const text2 = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(text2) ? `'${text2}` : text2;
  return `"${guarded.replaceAll('"', '""')}"`;
}
function toCsv(records) {
  const fields = MASTER_COLUMNS.filter((column) => records.some((record) => column in record));
  const header = fields.length ? fields : [...MASTER_COLUMNS];
  const rows = [header, ...records.map((record) => header.map((field2) => record[field2] ?? ""))];
  return rows.map((line2) => line2.map((value) => csvCell(value)).join(",")).join("\n");
}
function councilCode(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);
}

// ../../packages/ingest/src/value.ts
var UNIT = /(\d+)\s*(?:no\.?\s*)?(?:x\s*)?(dwellings|dwellinghouses|dwellinghouse|houses|house|flats|apartments|units|homes|bungalows)\b/i;
var FLOORSPACE = /(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*m|sqm|m2|m²|square metres)/i;
var RATES = {
  COMMERCIAL: [1500, 2200],
  HEALTHCARE: [2400, 3600],
  EDUCATION: [1800, 2600],
  INDUSTRIAL: [900, 1400]
};
function extractUnits(text2) {
  const match = text2.match(UNIT);
  if (match?.[1]) return Number(match[1]);
  if (/\b(?:a|one|single)\s+(?:new\s+|detached\s+|two-storey\s+)?(?:dwellinghouse|dwelling|house|bungalow)\b/i.test(text2)) return 1;
  if (/\berection of\s+(?:a\s+|one\s+)?(?:new\s+)?(?:dwellinghouse|dwelling|house|bungalow)\b/i.test(text2)) return 1;
  return null;
}
function extractFloorspace(text2) {
  const match = text2.match(FLOORSPACE);
  if (!match?.[1]) return null;
  const value = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}
function classifyScheme(text2, appSize) {
  const units = extractUnits(text2);
  const residential = Boolean(units) || /\b(dwelling|house|flat|apartment|bungalow|residential)\b/i.test(text2);
  let category = "";
  if (residential && units) category = "HOUSING UNITS";
  else if (/\b(office|retail|shop|warehouse|industrial|commercial)\b/i.test(text2)) category = "COMMERCIAL";
  else if (/\b(hospital|clinic|surgery|care home|nursing home)\b/i.test(text2)) category = "HEALTHCARE";
  else if (/\b(school|college|university|nursery)\b/i.test(text2)) category = "EDUCATION";
  else if (/\berection of\b|\bconstruct(?:ion)? of\b|\bredevelopment\b/i.test(text2)) category = "NEW BUILD";
  else if (/\bextension\b/i.test(text2)) category = "EXTENSION";
  let propType = "";
  if (/\bflats|apartments\b/i.test(text2)) propType = "Flats";
  else if (residential) propType = "Dwelling";
  else if (category === "COMMERCIAL") propType = "Commercial";
  else if (category === "EXTENSION") propType = "Extension";
  else if (appSize) propType = "";
  return { category, propType, units, floorspace: extractFloorspace(text2) };
}
function estimateValue(text2, category, units, floorspace) {
  let fromPounds = null;
  let toPounds = null;
  if ((category === "HOUSING UNITS" || category === "NEW BUILD") && units && units > 0) {
    fromPounds = units * 18e4;
    toPounds = units * 28e4;
  } else if (floorspace && floorspace > 0) {
    const [low, high] = RATES[category] ?? [1400, 2100];
    fromPounds = floorspace * low;
    toPounds = floorspace * high;
  }
  if (fromPounds === null || toPounds === null) return null;
  return {
    from: (fromPounds / 1e6).toFixed(3),
    to: (toPounds / 1e6).toFixed(3)
  };
}

// ../../packages/ingest/src/map.ts
function field(record, key) {
  const extra = record.other_fields;
  if (!extra || typeof extra !== "object") return "";
  return blank(extra[key]);
}
function stage(state) {
  const value = state.trim();
  if (!value) return "";
  if (/permit|grant|approv/i.test(value)) return "Permitted";
  if (/refus|reject/i.test(value)) return "Refused";
  if (/withdraw/i.test(value)) return "Withdrawn";
  return value;
}
function heading(description, reference) {
  const text2 = description.replace(/\s+/g, " ").trim();
  if (!text2) return reference;
  const cut = text2.split(/[.;]/)[0] ?? text2;
  return cut.length > 120 ? `${cut.slice(0, 117).trim()}\u2026` : cut;
}
function mapPlanItRecord(record) {
  const area = blank(record.area_name);
  const reference = applicationReference(record);
  if (!area || !reference) return null;
  const authority = lookupAuthority(area);
  const rawAddress = blank(record.address);
  const located = splitPostcode(rawAddress, blank(record.postcode));
  const description = blank(record.description);
  const classified = classifyScheme(`${description} ${blank(record.app_type)}`, blank(record.app_size));
  const value = estimateValue(description, classified.category, classified.units, classified.floorspace);
  const applicant = field(record, "applicant_name");
  const applicantAddress = field(record, "applicant_address");
  const agentName = field(record, "agent_name");
  const agentCompany = field(record, "agent_company") || agentName;
  const agentAddress = field(record, "agent_address");
  const agentLocated = splitPostcode(agentAddress);
  const applicantLocated = splitPostcode(applicantAddress);
  const applicantLines = addressLines(applicantAddress, applicantLocated.postcode);
  const agentLines = addressLines(agentAddress, agentLocated.postcode);
  const published = formatPublicationDate(blank(record.start_date) || field(record, "date_validated"));
  const columns = {
    Heading: heading(description, reference),
    "\xA3m Value From": value?.from ?? "",
    "\xA3m Value To": value?.to ?? "",
    Proposal: description,
    "Site Raw Address": rawAddress,
    "Client Applicant Contact": "",
    "Client Applicant": applicant,
    "Client Applicant Raw Address": applicantAddress,
    "Client Applicant Phone": "",
    "Architect Agent Contact": agentName,
    "Architect Agent": agentCompany,
    "Architect Agent Raw Address": agentAddress,
    "Architect Agent Phone": "",
    "Architect Agent Email": "",
    "Mail Client Contact": "",
    "Mail Client Name": applicant,
    "Client Applicant Address Line 1": applicantLines.line1,
    "Client Applicant Address Line 2": applicantLines.line2,
    "Client Applicant Address Line 3": applicantLines.line3,
    "Client Applicant Address Line 4": applicantLines.line4,
    "Client Applicant Postcode": applicantLocated.postcode,
    "Client Applicant Postcode Area": applicantLocated.area,
    "Mail Architect Agent Contact": agentName,
    "Mail Architect Agent Name": agentCompany,
    "Architect Agent Address Line 1": agentLines.line1,
    "Architect Agent Address Line 2": agentLines.line2,
    "Architect Agent Address Line 3": agentLines.line3,
    "Architect Agent Address Line 4": agentLines.line4,
    "Architect Agent Postcode": agentLocated.postcode,
    "Architect Agent Postcode Area": agentLocated.area,
    "Site Address": rawAddress,
    "Site Address Postcode Area": located.area,
    "Prop Type": classified.propType,
    "\xA3m Est Prop Val From": value?.from ?? "",
    "\xA3m Est Prop Val To": value?.to ?? "",
    "URL Link": blank(record.url) || blank(record.link),
    "Local Authority": authority.name,
    "Application Reference": reference,
    County: authority.county,
    Region: authority.region,
    "Project Stage": stage(blank(record.app_state)),
    "Publication Date": published,
    "Project ID": blank(record.name) || reference,
    "Project Category": classified.category
  };
  for (const column of MASTER_COLUMNS) columns[column] ??= "";
  const longitude = typeof record.location_x === "number" ? record.location_x : null;
  const latitude = typeof record.location_y === "number" ? record.location_y : null;
  return {
    authorityKey: area,
    reference,
    columns,
    longitude,
    latitude,
    lastDifferent: blank(record.last_different)
  };
}

// ../../packages/ingest/src/transform.ts
function transformRecords(records, config, since) {
  const kept = /* @__PURE__ */ new Map();
  let filteredOut = 0;
  let errors = 0;
  let cursor = since ?? "";
  for (const record of records) {
    const stamp = record.last_different ?? "";
    if (since && stamp && stamp <= since) {
      filteredOut += 1;
      continue;
    }
    if (stamp > cursor) cursor = stamp;
    try {
      if (rejectionReason(record, config)) {
        filteredOut += 1;
        continue;
      }
      const cleaned = mapPlanItRecord(record);
      if (!cleaned) {
        errors += 1;
        continue;
      }
      kept.set(`${cleaned.columns["Local Authority"]}|${cleaned.reference}`, cleaned.columns);
    } catch {
      errors += 1;
    }
  }
  return { rows: [...kept.values()], fetched: records.length, filteredOut, errors, cursor };
}
function recordsToCsv(rows) {
  return toCsv(rows.map((row) => {
    const full = {};
    for (const key of Object.keys(row)) full[key] = row[key] ?? "";
    return full;
  }));
}

// ../api/src/ingest/run.ts
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ../api/src/auth/mailer.ts
async function sendWithResend(message) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  try {
    const from = process.env.RESEND_FROM || "PlanningPal <alerts@planningpal.co.uk>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text })
    });
    if (!response.ok) {
      console.error(`Resend rejected a ${message.kind} message (${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Resend could not send a ${message.kind} message`, error instanceof Error ? error.message : "request failed");
    return false;
  }
}
function createMailer() {
  return {
    async send(message) {
      const delivered = await sendWithResend(message);
      const line2 = `[mail:${message.kind}] to ${message.to} \u2014 ${message.subject}${delivered ? " (resend)" : " (logged)"}
${message.text}`;
      console.info(line2);
      await db.insert(mailLog).values({
        kind: message.kind,
        recipient: message.to,
        subject: message.subject,
        body: message.text
      });
    }
  };
}
var mailer = createMailer();
async function notifyNewLeads(inserted, titles) {
  if (inserted < 1) return;
  const recipients = await db.select({ email: users.email, frequency: users.alertFrequency }).from(users).innerJoin(organisations, eq(users.organisationId, organisations.id)).where(and(eq(organisations.signalAlerts, true), eq(users.alertsEnabled, true), inArray(users.orgRole, ["owner", "admin"])));
  const history = await db.select({ recipient: mailLog.recipient, createdAt: mailLog.createdAt }).from(mailLog).where(eq(mailLog.kind, "lead-alert"));
  const lastSent = /* @__PURE__ */ new Map();
  for (const row of history) {
    const previous = lastSent.get(row.recipient);
    if (!previous || row.createdAt > previous) lastSent.set(row.recipient, row.createdAt);
  }
  const seen = /* @__PURE__ */ new Set();
  const sample = titles.filter(Boolean).slice(0, 8);
  const now = /* @__PURE__ */ new Date();
  for (const recipient of recipients) {
    if (!recipient.email || seen.has(recipient.email)) continue;
    if (!alertDue(recipient.frequency, lastSent.get(recipient.email) ?? null, now)) continue;
    seen.add(recipient.email);
    await mailer.send({
      kind: "lead-alert",
      to: recipient.email,
      subject: `${inserted} new planning ${inserted === 1 ? "lead" : "leads"}`,
      text: [`PlanningPal stored ${inserted} new scheme${inserted === 1 ? "" : "s"}.`, "", ...sample].join("\n")
    });
  }
}

// ../api/src/ingest/run.ts
var dataRoot = process.env.VERCEL ? "/tmp/planningpal" : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");
function sourceFor(sourceId) {
  if (sourceId === "london-datahub") return createLondonDatahubSource();
  if (sourceId === "auto") return createHybridPlanningSource();
  return createPlanItSource();
}
function hashFor(authority, reference) {
  return createHash("sha256").update(`${councilCode(authority)}|${reference}`).digest("hex");
}
function money(value) {
  if (!value) return "0.000";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(3) : "0.000";
}
function sitePostcode(address) {
  const match = address.toUpperCase().match(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/);
  if (!match?.[1] || !match[2]) return "";
  return `${match[1]} ${match[2]}`;
}
function statusFor(stage2) {
  if (/permit|grant|approv/i.test(stage2)) return "Permitted";
  if (/refus/i.test(stage2)) return "Refused";
  if (/withdraw/i.test(stage2)) return "Withdrawn";
  return stage2 || "Undecided";
}
var active = null;
async function startIngestRun(options) {
  if (active) {
    const error = new Error("A pipeline run is already in progress");
    error.statusCode = 409;
    throw error;
  }
  const sourceId = options.source ?? "planit";
  const cursorKey = sourceId === "london-datahub" ? "london-datahub" : "planit";
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, cursorKey)).limit(1);
  const since = options.since ?? (options.from || options.to || options.authority ? void 0 : cursor?.lastDifferent || void 0);
  const query = { ...options, source: sourceId, since };
  const [run] = await db.insert(pipelineRuns).values({
    source: sourceId,
    status: "running",
    cursorBefore: since ?? "",
    options: query
  }).returning();
  if (!run) throw new Error("Could not start pipeline run");
  active = executeRun(run.id, sourceId, cursorKey, query).finally(() => {
    active = null;
  });
  return { id: run.id, status: "running", done: active };
}
async function executeRun(runId, sourceId, cursorKey, query) {
  const source = sourceFor(sourceId);
  const rawRecords = [];
  try {
    let pageNumber = 0;
    for await (const page of source.fetchPages(query)) {
      rawRecords.push(...page.records);
      const rawDir = path.join(dataRoot, "raw", sourceId, runId);
      await mkdir(rawDir, { recursive: true });
      await writeFile(path.join(rawDir, `page-${String(pageNumber).padStart(3, "0")}.json`), JSON.stringify(page.body));
      await db.insert(rawPayloads).values({ runId, source: sourceId, requestUrl: page.url, body: page.body });
      pageNumber += 1;
    }
    const transformed = transformRecords(rawRecords, void 0, query.since);
    const csvPath = path.join(dataRoot, "ingest", `${runId}.csv`);
    await mkdir(path.dirname(csvPath), { recursive: true });
    await writeFile(csvPath, recordsToCsv(transformed.rows));
    const counts = await upsertRows(transformed.rows);
    await notifyNewLeads(counts.inserted, counts.titles);
    if (transformed.cursor) {
      await db.insert(ingestCursors).values({ source: cursorKey, lastDifferent: transformed.cursor, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent: transformed.cursor, updatedAt: /* @__PURE__ */ new Date() } });
    }
    await db.update(pipelineRuns).set({
      status: "succeeded",
      finishedAt: /* @__PURE__ */ new Date(),
      fetched: transformed.fetched,
      filteredOut: transformed.filteredOut,
      inserted: counts.inserted,
      updated: counts.updated,
      errors: transformed.errors,
      csvPath,
      cursorAfter: transformed.cursor
    }).where(eq(pipelineRuns.id, runId));
  } catch (error) {
    await db.update(pipelineRuns).set({
      status: "failed",
      finishedAt: /* @__PURE__ */ new Date(),
      message: error instanceof Error ? error.message : "Pipeline failed"
    }).where(eq(pipelineRuns.id, runId));
    throw error;
  }
}
async function upsertRows(rows) {
  if (!rows.length) return { inserted: 0, updated: 0, titles: [] };
  const hashes = rows.map((row) => hashFor(row["Local Authority"] ?? "", row["Application Reference"] ?? ""));
  const existing = await db.select({ hash: planningApplications.compositeHash }).from(planningApplications).where(inArray(planningApplications.compositeHash, hashes));
  const known = new Set(existing.map((row) => row.hash));
  const [maxRow] = await db.select({ max: sql`coalesce(max(${planningApplications.sourceIndex}), -1)::int` }).from(planningApplications);
  let nextIndex = (maxRow?.max ?? -1) + 1;
  let inserted = 0;
  let updated = 0;
  const titles = [];
  for (const row of rows) {
    const authority = row["Local Authority"] ?? "";
    const reference = row["Application Reference"] ?? "";
    const hash = hashFor(authority, reference);
    const councilId = await ensureCouncil(row);
    const values2 = {
      councilId,
      applicationRef: reference,
      compositeHash: hash,
      projectId: row["Project ID"] ?? "",
      heading: row.Heading ?? "",
      proposal: row.Proposal ?? "",
      valueFromM: money(row["\xA3m Value From"] ?? ""),
      valueToM: money(row["\xA3m Value To"] ?? ""),
      estValueFromM: money(row["\xA3m Est Prop Val From"] ?? ""),
      estValueToM: money(row["\xA3m Est Prop Val To"] ?? ""),
      siteRawAddress: row["Site Raw Address"] ?? "",
      siteAddress: row["Site Address"] ?? "",
      siteAddressLine1: row["Site Address"] ?? "",
      siteCounty: row.County ?? "",
      postcode: sitePostcode(row["Site Address"] ?? ""),
      outcode: row["Site Address Postcode Area"] ?? "",
      localAuthority: authority,
      county: row.County ?? "",
      region: row.Region ?? "",
      projectStage: row["Project Stage"] ?? "",
      status: statusFor(row["Project Stage"] ?? ""),
      primaryCategory: row["Project Category"] ?? "",
      propType: row["Prop Type"] ?? "",
      publicationDate: row["Publication Date"] ?? "",
      portalUrl: row["URL Link"] ?? "",
      clientApplicant: row["Client Applicant"] ?? "",
      clientApplicantRawAddress: row["Client Applicant Raw Address"] ?? "",
      architectAgentContact: row["Architect Agent Contact"] ?? "",
      architectAgent: row["Architect Agent"] ?? "",
      architectAgentRawAddress: row["Architect Agent Raw Address"] ?? "",
      sourceRecord: row,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (known.has(hash)) {
      const [saved] = await db.update(planningApplications).set(values2).where(eq(planningApplications.compositeHash, hash)).returning({ id: planningApplications.id });
      if (saved) await replaceContacts(saved.id, row);
      updated += 1;
    } else {
      const [saved] = await db.insert(planningApplications).values({ ...values2, sourceIndex: nextIndex }).returning({ id: planningApplications.id });
      nextIndex += 1;
      if (saved) await replaceContacts(saved.id, row);
      inserted += 1;
      titles.push(row.Heading || reference);
      known.add(hash);
    }
  }
  return { inserted, updated, titles };
}
async function ensureCouncil(row) {
  const name = row["Local Authority"] || "Unknown authority";
  const code = councilCode(name);
  const [existing] = await db.select({ id: councils.id }).from(councils).where(eq(councils.code, code)).limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(councils).values({
    code,
    name,
    portalType: "PLANIT",
    baseUrl: "https://www.planit.org.uk",
    county: row.County ?? "",
    region: row.Region ?? ""
  }).onConflictDoNothing().returning({ id: councils.id });
  if (created) return created.id;
  const [again] = await db.select({ id: councils.id }).from(councils).where(eq(councils.code, code)).limit(1);
  return again?.id;
}
async function replaceContacts(applicationId, row) {
  await db.delete(decisionMakers).where(eq(decisionMakers.applicationId, applicationId));
  const contacts = [];
  if (row["Architect Agent"] || row["Architect Agent Contact"]) {
    contacts.push({
      applicationId,
      role: "ARCHITECT",
      firmName: row["Architect Agent"] ?? "",
      contactName: row["Architect Agent Contact"] ?? "",
      rawAddress: row["Architect Agent Raw Address"] ?? "",
      postcode: row["Architect Agent Postcode"] ?? "",
      confidenceLevel: "MANUAL_REVIEW"
    });
  }
  if (row["Client Applicant"]) {
    contacts.push({
      applicationId,
      role: "APPLICANT",
      firmName: row["Client Applicant"] ?? "",
      contactName: row["Client Applicant Contact"] ?? "",
      rawAddress: row["Client Applicant Raw Address"] ?? "",
      postcode: row["Client Applicant Postcode"] ?? "",
      confidenceLevel: "MANUAL_REVIEW"
    });
  }
  if (contacts.length) await db.insert(decisionMakers).values(contacts);
}

// ../api/src/ingest/scheduler.ts
var SLOTS = [6, 13, 20];
function londonNow(date2 = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date2);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return { key: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")), minute: Number(get("minute")) };
}
function isIngestSlot(date2 = /* @__PURE__ */ new Date()) {
  const now = londonNow(date2);
  return SLOTS.includes(now.hour) && now.minute <= 10;
}

// ../api/src/ingest/batch.ts
var CURSOR = "planit-authorities";
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function ingestAuthorityBatch(options) {
  if (!options?.force && !isIngestSlot()) {
    return { skipped: true, reason: "Outside the scheduled Europe/London windows" };
  }
  const catalogue = await db.select({ areas: localPlanningAuthorities.planitQueryAreas, status: localPlanningAuthorities.status, coverage: localPlanningAuthorities.coverage }).from(localPlanningAuthorities);
  const authorities = [...new Set(catalogue.filter((row) => row.status === "active" && row.coverage !== "unavailable").flatMap((row) => row.areas))].sort((a, b2) => a.localeCompare(b2));
  const budgetMs = options?.budgetMs ?? Number(process.env.INGEST_BUDGET_MS || 45e3);
  const maxAuthorities = options?.maxAuthorities ?? Number(process.env.INGEST_BATCH_LIMIT || 1);
  const intervalMs = options?.intervalMs ?? Number(process.env.PLANIT_MIN_INTERVAL_MS || 6e4);
  const [cursor] = await db.select().from(ingestCursors).where(eq(ingestCursors.source, CURSOR)).limit(1);
  let index2 = Number(cursor?.lastDifferent || 0);
  if (!Number.isFinite(index2) || index2 < 0 || index2 >= authorities.length) index2 = 0;
  const started = Date.now();
  const processed = [];
  const failed = [];
  while (index2 < authorities.length && processed.length < maxAuthorities && Date.now() - started < budgetMs) {
    const authority = authorities[index2];
    if (!authority) break;
    if (processed.length > 0 && intervalMs > 0) {
      if (Date.now() - started + intervalMs >= budgetMs) break;
      await sleep2(intervalMs);
    }
    try {
      const run = await startIngestRun({
        authority,
        recentDays: options?.recentDays ?? 3,
        maxPages: 1,
        source: options?.source
      });
      await run.done;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authority scan failed";
      failed.push({ authority, error: message });
      break;
    }
    processed.push(authority);
    index2 += 1;
    const next = index2 >= authorities.length ? "0" : String(index2);
    await db.insert(ingestCursors).values({ source: CURSOR, lastDifferent: next, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({ target: ingestCursors.source, set: { lastDifferent: next, updatedAt: /* @__PURE__ */ new Date() } });
  }
  if (index2 >= authorities.length) index2 = 0;
  return { ok: failed.length === 0, skipped: false, processed, failed, nextIndex: index2, total: authorities.length };
}

// server/cron-ingest.ts
async function handler(request, response) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers?.authorization;
  const token = Array.isArray(header) ? header[0] : header;
  if (!secret || token !== `Bearer ${secret}`) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await ingestAuthorityBatch({ force: true });
    response.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingest failed";
    console.error(`PlanIt ingest failed: ${message}`);
    response.status(200).json({ ok: false, skipped: false, processed: [], failed: [{ authority: "", error: message }] });
  }
}
export {
  handler as default
};
