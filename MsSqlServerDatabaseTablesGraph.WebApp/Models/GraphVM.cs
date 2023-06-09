using System;
using System.Collections.Generic;
using System.Xml.Linq;

using Newtonsoft.Json;

namespace MsSqlServerDatabaseTablesGraph.WebApp.Models
{
    /// <summary>
    /// 
    /// </summary>    
    public sealed class Graph : DALError
    {
        public Graph( ICollection< Node > nodes, ICollection< Link > links ) => (Nodes, Links) = (nodes, links);
        private Graph( Exception ex ) : base( ex ) { }
        private Graph( string errorMessage ) : base( errorMessage ) { }
        public static Graph CreateError( Exception ex ) => new Graph( ex );
        public static Graph CreateError( string errorMessage ) => new Graph( errorMessage );

        [JsonProperty("nodes")] public ICollection< Node > Nodes { get; }
        [JsonProperty("links")] public ICollection< Link > Links { get; }

        public override string ToString() => ((Error != null) ? $"Error: {Error}, " : null) + 
                                             $"Nodes={Nodes?.Count}, Links={Links?.Count}";
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

        [JsonProperty("id")]           public int Id         { get; set; }
        [JsonProperty("source")]       public int SourceNode { get; set; }
        [JsonProperty("target")]       public int TargetNode { get; set; }
        [JsonProperty("type")]         public int LinkType   { get; set; } = 1; //LINK_TYPE_DIRECTED
        [JsonProperty("sourceFields")] public IList< string > SourceFields { get; set; }
        [JsonProperty("targetFields")] public IList< string > TargetFields { get; set; }

        public override string ToString() => $"Src={SourceNode}, Trg={TargetNode}";
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

        [JsonProperty("x")]        public double X        { get; set; }
        [JsonProperty("y")]        public double Y        { get; set; }
        [JsonProperty("id")]       public int    Id       { get; set; }
        [JsonProperty("name")]     public string Name     { get; set; }
        [JsonProperty("selected")] public bool   Selected { get; set; }

        public override string ToString() => $"Id={Id}, Name={Name}, (X={X}, Y={Y})";
    }
}