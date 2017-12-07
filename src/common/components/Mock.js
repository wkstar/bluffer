import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { string, func, instanceOf, oneOfType, bool } from 'prop-types';
import { deleteMock, saveMockResponse } from '../modules/proxy/actions';
import testClass from '../testClass';

class Mock extends Component {
  static propTypes = {
    url: string.isRequired,
    responseBody: string.isRequired,
    timestamp: oneOfType([string, instanceOf(Date)]).isRequired,
    lastServed: oneOfType([string, instanceOf(Date)]),
    saveMockResponse: func.isRequired,
    mockHasBeenServedRecently: bool,
    deleteMock: func.isRequired,
  };

  static defaultProps = {
    mockHasBeenServedRecently: false,
  };

  state = {
    isEditMode: false,
  };

  toggleMockForm = e => {
    e.preventDefault();
    this.setState({ isEditMode: !this.state.isEditMode });
  };

  cancelEdit = e => {
    e.preventDefault();
    this.setState({ isEditMode: false });
    this.textarea.value = this.props.responseBody;
  };

  mockResponse = e => {
    e.preventDefault();
    this.props.saveMockResponse(this.props.url, this.textarea.value);
    this.setState({ isEditMode: false });
  };

  deleteMock = e => {
    e.preventDefault();
    this.props.deleteMock(this.props.url);
  };

  render() {
    const {
      url,
      timestamp,
      responseBody,
      mockHasBeenServedRecently,
    } = this.props;
    const { isEditMode } = this.state;
    const dateTime = moment(timestamp).format('DD-MMM HH:mm:ss');
    const recentlyServedClass = mockHasBeenServedRecently
      ? 'recentlyServed'
      : '';

    const detailsPanel = isEditMode && (
      <li className="list-group-item" key={`${url}-details`}>
        <div className="w-100 form-group">
          <div className="response-details--label">
            URL:
          </div>
          <div id="url">{url}</div>
        </div>
        <div className="w-100  form-group">
          <div className="response-details--label">
            Response body:
          </div>
          <textarea
            id="responseBody"
            ref={r => {
              this.textarea = r;
            }}
            rows="10"
            className={`col form-control ${testClass('textarea')}`}
            defaultValue={responseBody}
          />
        </div>
        <div className="w-100">
          <button className="btn btn-primary" onClick={this.mockResponse}>
            Save
          </button>
          <button
            onClick={this.cancelEdit}
            className="ml-1 btn btn-primary"
            alt="cancel"
          >
            Cancel
          </button>
          <button
            onClick={this.deleteMock}
            className="btn btn-primary btn-danger float-right"
            alt="delete"
          >
            Remove
          </button>
        </div>
      </li>
    );

    return (
      <div className={`mt-1 ${testClass('response')}`}>
        <li
          role="presentation"
          className={`list-group-item response-header ${recentlyServedClass}`}
          key={`${url}-header`}
          onClick={this.toggleMockForm}
          onKeyPress={this.toggleMockForm}
        >
          <div className="row w-100">
            <div className="col-9 url" title={url}>
              {url}
            </div>
            <div className="col-3">
              <div className="float-right">{dateTime}</div>
            </div>
          </div>
        </li>
        {detailsPanel}
      </div>
    );
  }
}

export default connect(null, { deleteMock, saveMockResponse })(Mock);
