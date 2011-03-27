function HostedZoneTreeView() {
  this.rows = [];
  this.printRows = [];
  this.rowCount = 0;
  this.selection = null;
  this.sorted = false;
}

HostedZoneTreeView.prototype = {
  getCellText: function(row, column) {
    return $CELL(this.printRows[row], column.id);
  },

  setTree: function(tree) {
    this.tree = tree;
  },

  isSorted: function() {
    return this.sorted;
  },

  cycleHeader: function(column) {
    var row = this.selectedRow();

    sortRowsByColumn(column, this.rows);
    this.invalidate();
    this.sorted = true;

    if (row) {
      this.selectByName(row.Name);
    }
  },

  invalidate: function() {
    this.printRows.length = 0;

    var filterValue = $V('hosted-zone-tree-filter');

    function filter(elem) {
      if (!filterValue) { return true; }

      var r = new RegExp(filterValue);

      for each (var child in elem.*) {
        var innerText = child.toString().replace(/<[^>]+>/g, '');
        if (r.test(innerText)) { return true;  }
      }

      return false;
    };

    for (var i = 0; i < this.rows.length; i++) {
      var row =  this.rows[i];

      if (filter(row)) {
        this.printRows.push(row);
      }
    }

    if (this.rowCount != this.printRows.length) {
      this.tree.rowCountChanged(0, -this.rowCount);
      this.rowCount = this.printRows.length;
      this.tree.rowCountChanged(0, this.rowCount);
    }

    this.tree.invalidate();
  },

  refresh: function() {
    this.rows.length = 0;

    $R53(function(r53cli) {
      var xhr = r53cli.listHostedZones();

      for each (var member in xhr.xml()..HostedZones.HostedZone) {
        this.rows.push(member);
      }
    }.bind(this), $('main-window-loader'));

    this.invalidate();
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.printRows[idx] : null;
  },

  createHostedZone: function() {
    var result = openModalDialog('hosted-zone-create-window');
    if (!result) { return; }

    var xml = <CreateHostedZoneRequest xmlns="https://route53.amazonaws.com/doc/2010-10-01/"></CreateHostedZoneRequest>;
    xml.Name = result.name;
    xml.CallerReference = result.callerReference;

    if (result.comment) {
      xml.HostedZoneConfig.Comment = result.comment;
    }

    $R53(function(r53cli) {
      r53cli.createHostedZone('<?xml version="1.0" encoding="UTF-8"?>' + xml);
      this.refresh();
    }.bind(this), $('main-window-loader'));
  },

  showDetail: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var hzid = this.hostedZoneId(row);
    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.getHostedZone(hzid);
    }, $('main-window-loader'));

    if (xhr && xhr.success()) {
      openModalDialog('hosted-zone-detail-window', {xml: xhr.xml()});
    }
  },

  deleteHostedZone: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var hzid = this.hostedZoneId(row);
    var name = row.Name.toString();

    if (!confirm("Are you sure you want to delete '" + name + "' ?")) {
      return;
    }

    $R53(function(r53cli) {
      r53cli.deleteHostedZone(hzid);
      this.refresh();
    }.bind(this), $('main-window-loader'));
  },

  openRRSet: function(event) {
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    var hzid = this.hostedZoneId(row);
    openModalDialog('rrset-window', {hostedZoneId:hzid, hostedZoneName:row.Name.toString()});
  },

  selectByName: function(name) {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];

      if (user.Name.toString() == name.toString()) {
        this.selection.select(i);
      }
    }

    this.rows
  },

  copyColumnToClipboard: function(name) {
    var row = this.selectedRow();

    if (row) {
      copyToClipboard($CELL(row, name, 0));
    }
  },

  hostedZoneId: function(row) {
    var hzid = row.Id.toString();
    hzid = hzid.split('/');
    return hzid[hzid.length - 1];
  }
};