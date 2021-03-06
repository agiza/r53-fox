/*
R53 Fox - a GUI client of Amazon Route 53
Copyright (C) 2011 Genki Sugawara

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

function onLoad() {
  var hostedZoneName = window.arguments[0].hostedZoneName;
  $('rrset-create-window-name').value = '.' + hostedZoneName;
}

function typeOnCommand() {
  var type = $('rrset-create-window-type').selectedItem.value;

  var identifier = $('rrset-create-window-identifier');
  var weight = $('rrset-create-window-weight');
  var ttl = $('rrset-create-window-ttl');

  if (({A:1, AA:1, AAAA:1, CNAME:1, TXT:1})[type]) {
    identifier.disabled = false;
    weight.disabled = false;
  } else {
    identifier.disabled = true;
    weight.disabled = true;
  }

  ttl.disabled = (type == 'AA');
}

function onAccept() {
  var args = window.arguments[0];

  var name = $V('rrset-create-window-name');
  var type = $('rrset-create-window-type').selectedItem.value;
  var identifier = $V('rrset-create-window-identifier');
  var weight = $V('rrset-create-window-weight');
  var ttl = $V('rrset-create-window-ttl');
  var value = $V('rrset-create-window-value');
  var comment = $V('rrset-create-window-comment');

  if (!name || !value) {
    alert("Please input 'Name' and 'Value'.");
    return;
  }

  if (type != 'AA' && !ttl) {
    alert("Please input 'TTL'.");
    return;
  }

  if ((identifier || weight) && !(({A:1, AA:1, AAAA:1, CNAME:1, TXT:1})[type])) {
    alert("Weighted resource record sets are supported only for A, AAAA, CNAME, and TXT record types.");
    return;
  }

  if ((identifier && !weight) || (!identifier && weight)) {
    alert("Please input 'Identifier' and 'Weight'.");
    return;
  }

  if (type == 'AA') {
    if (ttl) {
      alert("A (Alias) cannot set TTL.");
      return;
    }

    var endpoint = ELBClient.getEndpoint(value);

    if (!endpoint) {
      alert('Cannot get ELB endpoint.');
      return;
    }
  }

  args.accepted = true;
  args.result = {name:name, type:type, identifier:identifier, weight:weight, ttl:ttl, value:value, comment:comment};

  close();
}
