/**
 @license
 (C) Copyright Nuxeo Corp. (http://nuxeo.com/)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// extended and created by NEOM
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import '@nuxeo/nuxeo-ui-elements/widgets/nuxeo-card.js';
import '@nuxeo/nuxeo-ui-elements/nuxeo-path-suggestion/nuxeo-path-suggestion.js';
import '@nuxeo/nuxeo-ui-elements/dataviz/nuxeo-document-distribution-chart.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { I18nBehavior } from '@nuxeo/nuxeo-ui-elements/nuxeo-i18n-behavior.js';

import '@nuxeo/nuxeo-elements/nuxeo-operation.js';
import '@nuxeo/nuxeo-ui-elements/nuxeo-data-table/iron-data-table.js';
// import { LIST } from './lists.data';

/**
 `neom-advance-reports`
 @element neom-advance-reports
 */
Polymer({
  _template: html`
    <!--TODO: Translations-->
    <style include="iron-flex">
      :host {
        display: block;
      }

      .suggestion-wrapper {
        border-radius: 2px;
        border: 1px solid var(--nuxeo-border);
        padding: 0 8px;
      }

      .suggestion-wrapper iron-icon {
        color: var(--dark-primary-color);
        margin-right: 8px;
      }

      paper-slider {
        width: 100%;
      }

      nuxeo-path-suggestion {
        --nuxeo-path-suggestion-results: {
          z-index: 2;
        }
        --paper-input-container-underline: {
          display: none;
        }
        --paper-input-container-underline-focus: {
          display: none;
        }
      }
    </style>

    <nuxeo-connection id="nxconn"></nuxeo-connection>

    <template is="dom-if" if="[[visible]]">
      <iron-ajax
        auto
        method="post"
        content-type="application/json"
        url="{{resolveUrl}}"
        body='{"params":{"directoryName":"nature","dbl10n":false,"localize":true,"lang":"en","searchTerm":""},"context":{}}'
        handle-as="json"
        on-response="onResponse"
        id="xhr2"
      ></iron-ajax>

      <div class="flex-layout">
        <nuxeo-card>
          <nuxeo-data-table items="{{reports}}" label="ADVANCE REPORT" style="min-height: 410px !important">
            <nuxeo-data-table-column name="Event Name">
              <template>
                [[getFolderName(item)]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Sub-Event">
              <template>
                [[item.dc:title]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Sector">
              <template>
                [[item.dc:sector]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Event Date(Range)">
              <template>
                [[getDateRange(item)]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Event Description">
              <template>
                [[item.dc:description]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Associated Asset Types">
              <template>
                [[getAssets(item.dc:assets)]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Link to Collection">
              <template>
                <a href="[[getLinkToCollection(item)]]">Click here to open</a>
              </template>
            </nuxeo-data-table-column>
          </nuxeo-data-table>
        </nuxeo-card>
      </div>
    </template>
  `,

  is: 'neom-advance-reports',
  behaviors: [I18nBehavior],
  url: '/nuxeo/api/v1/automation/Directory.AdvancedReportEntries',

  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    showTable: {
      type: Boolean,
      value: false,
    },
    reports: {
      type: Array,
      value: [],
    },
    resolveUrl: {
      type: String,
    },
    originUrl: {
      type: String,
      value: '',
    },
  },

  observers: [],

  ready() {
    this.originUrl = window.location.origin;
    this.set('resolveUrl', this.originUrl + this.url);
  },

  onResponse(event, request) {
    if (!request?.response) return;
    this.reports = Object.values(request.response);
  },

  getLinkToCollection(item) {
    return `${this.originUrl}/nuxeo/ui/#!/browse${item['dc:path']}/${item['dc:name']}`;
  },

  getDateRange(item) {
    const startDate = item['dc:start'];
    const endDate = item['dc:end'];
    let resultString = startDate && `Start date - ${new Date(startDate).toDateString()} \n`;
    resultString += endDate && `, End date - ${new Date(endDate).toDateString()}`;
    return resultString;
  },

  getAssets(assetObject) {
    if (!assetObject) {
      return 'Empty';
    }
    
    let result = '';
    for (const key in assetObject) {
      result += `${key} ${assetObject[key]}, `;
    }
    return result.substr(0, result.length - 2);
    
  },

  getFolderName(item) {
    return item['dc:parentName'];
  }
});
