using System;
using System.Collections.Generic;

using Newtonsoft.Json;

namespace MsSqlServerDatabaseTablesGraph.WebApp.Models
{
    /// <summary>
    /// 
    /// </summary>    
    public sealed class Graph : DALError
    {
        public Graph() { }
        private Graph( Exception ex ) : base( ex ) { }
        private Graph( string errorMessage ) : base( errorMessage ) { }
        public static Graph CreateError( Exception ex ) => new Graph( ex );
        public static Graph CreateError( string errorMessage ) => new Graph( errorMessage );

        public IEnumerable< Node > nodes;
        public IEnumerable< Link > links;


        public int nodesTotalCount;
        public int linksTotalCount;
        public IEnumerable< string > documents;
    }

    /*/// <summary>
    /// 
    /// </summary>
    public enum LinkTypeEnum
    {
        None = 0,
        Directed = 1,
        Bidirectional = 2,
    }*/

    /// <summary>
    /// 
    /// </summary>    
    public sealed class Link
    {
        /// <summary>
        /// 
        /// </summary>
        public sealed class EqualityComparer : IEqualityComparer< Link >
        {
            public bool Equals( Link x, Link y ) => ((x.SourceNode == y.SourceNode && x.TargetNode == y.TargetNode) ||
                                                     (x.SourceNode == y.TargetNode && x.TargetNode == y.SourceNode) &&
                                                     (x.SourceFields == y.SourceFields && x.TargetFields == y.TargetFields) ||
                                                     (x.SourceFields == y.TargetFields && x.TargetFields == y.SourceFields));

            public int GetHashCode( Link obj ) => (obj.SourceNode.GetHashCode() ^ obj.TargetNode.GetHashCode() ^
                                                   obj.SourceFields.GetHashCode() ^ obj.TargetFields.GetHashCode());

        }

        public Link( int id ) => Id = id;

        [JsonProperty("id")]           public int Id;
        [JsonProperty("source")]       public int SourceNode;
        [JsonProperty("target")]       public int TargetNode;
        [JsonProperty("type")]         public int LinkType = 1; //LINK_TYPE_DIRECTED
        [JsonProperty("sourceFields")] public IEnumerable< string > SourceFields;
        [JsonProperty("targetFields")] public IEnumerable< string > TargetFields;
    }



    /// <summary>
    /// 
    /// </summary>
    public sealed class Node
    {
        /// <summary>
        /// 
        /// </summary>
        public sealed class EqualityComparer : IEqualityComparer< Node >
        {
            public bool Equals( Node x, Node y ) => (x.Id == y.Id);
            public int GetHashCode( Node obj ) => obj.Id;
        }

        public Node( int id, string name, bool selected = false )
        {
            Id       = id;
            Name     = name;
            Selected = selected;
        }

        [JsonProperty("x")]        public double X;
        [JsonProperty("y")]        public double Y;
        [JsonProperty("id")]       public int    Id;
        [JsonProperty("name")]     public string Name;
        [JsonProperty("selected")] public bool   Selected;
    }
}